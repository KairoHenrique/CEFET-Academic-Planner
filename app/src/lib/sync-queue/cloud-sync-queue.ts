import { randomUUID } from "node:crypto";
import { ApiError, notFoundError, validationError } from "@/lib/api/errors";
import { findEncryptedPasswordByCpf } from "@/lib/auth/account/profile-repository";
import { getPostgresPool } from "@/lib/db/postgres/pool";
import { normalizeSyncMode } from "@/lib/sync-policy/resolve-sync-mode";
import { sealQueuePassword } from "@/lib/sync-queue/queue-credential-seal";
import {
  pgFindActiveSyncJobByIdempotencyKey,
  pgFindActiveSyncJobByUsername,
  pgFindSyncJobById,
  pgInsertSyncJob,
  pgSyncJobRowToView,
  type PgSyncJobRobot,
} from "@/lib/sync-queue/pg-sync-jobs-store";
import type {
  EnqueueSyncJobResult,
  SyncQueueJobView,
  SyncQueueLane,
} from "@/lib/sync-queue/types";
import {
  resolveWorkerDispatchConfig,
  type WorkerDispatchConfig,
} from "@/lib/sync-queue/worker-dispatch";
import type { SyncMode } from "@/lib/types/sync-pipeline";

/**
 * Fila de sync no deploy cloud (B72e): job persistido no Postgres +
 * dispatch async ao worker Playwright hospedado (`SIGAA_WORKER_URL`).
 * A senha nunca é persistida — vai selada (AES-GCM) só no dispatch HTTPS.
 */

export type CloudSyncTrigger = "first_login" | "manual" | "auto";

export interface CloudEnqueueSyncInput {
  username: string;
  password?: string;
  mode: SyncMode;
  lane: SyncQueueLane;
  trigger: CloudSyncTrigger;
  robot?: PgSyncJobRobot;
  idempotencyKey?: string;
}

export function isCloudSyncWorkerConfigured(): boolean {
  return resolveWorkerDispatchConfig() !== null;
}

export function parseCloudEnqueueRequest(body: unknown): CloudEnqueueSyncInput {
  if (!body || typeof body !== "object") {
    throw validationError("Corpo da requisição inválido.");
  }

  const record = body as Record<string, unknown>;
  const username =
    typeof record.username === "string" ? record.username.trim() : "";
  if (!username) {
    throw validationError("Informe o usuário do SIGAA.");
  }

  const trigger =
    record.trigger === "first_login" ||
    record.trigger === "manual" ||
    record.trigger === "auto"
      ? record.trigger
      : "manual";

  const lane: SyncQueueLane =
    record.lane === "priority" || trigger === "first_login"
      ? "priority"
      : "normal";

  return {
    username,
    password:
      typeof record.password === "string" && record.password.length > 0
        ? record.password
        : undefined,
    mode: normalizeSyncMode(
      typeof record.mode === "string" ? record.mode : undefined,
      trigger === "first_login" ? "full" : "lite"
    ),
    lane,
    trigger,
    idempotencyKey:
      typeof record.idempotencyKey === "string"
        ? record.idempotencyKey.trim() || undefined
        : undefined,
  };
}

async function resolveCloudPasswordEnc(
  input: Pick<CloudEnqueueSyncInput, "username" | "password">
): Promise<string> {
  if (input.password) {
    return sealQueuePassword(input.password);
  }

  const stored = await findEncryptedPasswordByCpf(input.username);
  if (stored?.trim()) {
    return stored;
  }

  throw new ApiError(
    "INVALID_CREDENTIALS",
    "Sem senha SIGAA salva para esta conta — informe a senha para sincronizar.",
    401
  );
}

export async function dispatchAsyncJobToWorker(options: {
  config: WorkerDispatchConfig;
  jobId: string;
  robot: PgSyncJobRobot;
  username: string;
  passwordEnc: string;
  mode: SyncMode;
}): Promise<void> {
  let response: Response;
  try {
    response = await fetch(`${options.config.workerUrl}/jobs`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${options.config.workerSecret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jobId: options.jobId,
        robot: options.robot,
        username: options.username,
        passwordEnc: options.passwordEnc,
        mode: options.mode,
        savePassword: false,
        execution: "async",
      }),
    });
  } catch {
    throw new ApiError(
      "SIGAA_OFFLINE",
      "Worker de sincronização inacessível. Tente novamente em instantes.",
      503
    );
  }

  if (response.status !== 202) {
    const detail = await response.text().catch(() => "");
    console.error(
      `[cloud-sync] Worker rejeitou dispatch (${response.status}): ${detail.slice(0, 200)}`
    );
    throw new ApiError(
      "SIGAA_OFFLINE",
      "Worker de sincronização indisponível no momento.",
      503
    );
  }
}

export async function enqueueCloudSyncJob(
  input: CloudEnqueueSyncInput
): Promise<EnqueueSyncJobResult> {
  const config = resolveWorkerDispatchConfig();
  if (!config) {
    throw new ApiError(
      "SIGAA_OFFLINE",
      "Sincronização indisponível: worker não configurado no deploy.",
      503
    );
  }

  const pool = getPostgresPool();

  if (input.idempotencyKey) {
    const existingByKey = await pgFindActiveSyncJobByIdempotencyKey(
      pool,
      input.idempotencyKey
    );
    if (existingByKey) {
      return { job: pgSyncJobRowToView(existingByKey), reused: true };
    }
  }

  const robot = input.robot ?? "r1";

  // Reuso por usuário só vale para o pipeline r1 — jobs de catálogo (turmas/
  // calendário) usam a credencial de um CPF elegível e não devem colidir.
  if (robot === "r1") {
    const activeJob = await pgFindActiveSyncJobByUsername(
      pool,
      input.username
    );
    if (activeJob) {
      return { job: pgSyncJobRowToView(activeJob), reused: true };
    }
  }

  const passwordEnc = await resolveCloudPasswordEnc(input);
  const jobId = randomUUID();

  const created = await pgInsertSyncJob(pool, {
    id: jobId,
    username: input.username,
    lane: input.lane,
    trigger: input.trigger,
    mode: input.mode,
    robot,
    idempotencyKey: input.idempotencyKey ?? null,
  });

  try {
    await dispatchAsyncJobToWorker({
      config,
      jobId,
      robot,
      username: input.username,
      passwordEnc,
      mode: input.mode,
    });
  } catch (error) {
    await pool.query(
      `UPDATE sync_jobs
       SET status = 'failed', finished_at = now(),
           error_code = 'WORKER_DISPATCH_FAILED',
           error_message = 'Falha ao despachar job ao worker.'
       WHERE id = $1`,
      [jobId]
    );
    throw error;
  }

  return { job: pgSyncJobRowToView(created), reused: false };
}

/**
 * Caminho direto `POST /api/sync` no cloud: dispatch síncrono — segura a
 * request até o worker terminar (rota tem `maxDuration` alto).
 */
export async function runCloudSyncDirect(input: {
  username: string;
  password?: string;
  mode: SyncMode;
}): Promise<{
  steps: Array<{ label: string; progress: number }>;
  partial?: boolean;
  jobId: string;
}> {
  const config = resolveWorkerDispatchConfig();
  if (!config) {
    throw new ApiError(
      "SIGAA_OFFLINE",
      "Sincronização indisponível: worker não configurado no deploy.",
      503
    );
  }

  const passwordEnc = await resolveCloudPasswordEnc(input);
  const jobId = randomUUID();

  let response: Response;
  try {
    response = await fetch(`${config.workerUrl}/jobs`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.workerSecret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jobId,
        robot: "r1",
        username: input.username,
        passwordEnc,
        mode: input.mode,
        savePassword: false,
        execution: "sync",
      }),
    });
  } catch {
    throw new ApiError(
      "SIGAA_OFFLINE",
      "Worker de sincronização inacessível. Tente novamente em instantes.",
      503
    );
  }

  const payload = (await response.json().catch(() => null)) as
    | {
        status?: string;
        steps?: Array<{ label: string; progress: number }>;
        partial?: boolean;
        error?: { code: string; message: string };
      }
    | null;

  if (!response.ok || payload?.status !== "completed") {
    const code = payload?.error?.code ?? "SIGAA_OFFLINE";
    const message =
      payload?.error?.message ?? "Falha na sincronização via worker.";
    throw new ApiError(
      code === "SIGAA_AUTH_FAILED" || code === "INVALID_CREDENTIALS"
        ? code
        : "SIGAA_OFFLINE",
      message,
      code === "SIGAA_AUTH_FAILED" || code === "INVALID_CREDENTIALS" ? 401 : 502
    );
  }

  return {
    steps: payload.steps ?? [],
    partial: payload.partial,
    jobId,
  };
}

export async function getCloudSyncJobView(
  jobId: string,
  requesterUsername?: string | null
): Promise<SyncQueueJobView> {
  const pool = getPostgresPool();
  const row = await pgFindSyncJobById(pool, jobId);

  // Escopo por usuário: não vaza status/CPF de jobs de terceiros.
  const requester = requesterUsername?.trim();
  if (!row || (requester && row.username !== requester)) {
    throw notFoundError("Job de sync não encontrado.");
  }

  return pgSyncJobRowToView(row);
}
