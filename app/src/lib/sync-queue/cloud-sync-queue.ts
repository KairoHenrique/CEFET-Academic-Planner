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
import { pgReclaimStaleSyncJobs } from "@/lib/sync-queue/reclaim-stale-sync-jobs";
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
        dbUrl: process.env.DATABASE_URL,
      }),
    });
  } catch (err) {
    console.error("[cloud-sync] Erro ao conectar ao worker:", err);
    throw new ApiError(
      "SIGAA_OFFLINE",
      `Worker de sincronização inacessível (${err instanceof Error ? err.message : String(err)}).`,
      503
    );
  }

  if (response.status !== 202) {
    const detail = await response.text().catch(() => "");
    let jsonMsg: string | undefined;
    let jsonCode: string | undefined;
    try {
      const parsed = JSON.parse(detail);
      jsonMsg = parsed?.error?.message || parsed?.message;
      jsonCode = parsed?.error?.code || parsed?.code;
    } catch {}

    const errorMsg = jsonMsg || (detail ? detail.slice(0, 150) : `HTTP ${response.status}`);
    console.error(
      `[cloud-sync] Worker rejeitou dispatch (${response.status}): ${detail.slice(0, 200)}`
    );
    throw new ApiError(
      (jsonCode as any) || "SIGAA_OFFLINE",
      `Worker indisponível (${response.status}): ${errorMsg}`,
      503
    );
  }
}

async function markCloudJobDispatchFailed(
  pool: ReturnType<typeof getPostgresPool>,
  jobId: string
): Promise<void> {
  await pool.query(
    `UPDATE sync_jobs
     SET status = 'failed', finished_at = now(),
         error_code = 'WORKER_DISPATCH_FAILED',
         error_message = 'Falha ao despachar job ao worker.'
     WHERE id = $1 AND status IN ('queued', 'running')`,
    [jobId]
  );
}

/**
 * Job `queued` reusado sem novo POST ao worker = UI presa em ~19%.
 * Reenvia o dispatch; se o worker já tiver claimado, o claim falha no-op.
 */
async function reuseOrRedispatchActiveJob(options: {
  pool: ReturnType<typeof getPostgresPool>;
  config: WorkerDispatchConfig;
  job: Awaited<ReturnType<typeof pgFindActiveSyncJobByUsername>>;
  input: CloudEnqueueSyncInput;
  robot: PgSyncJobRobot;
}): Promise<EnqueueSyncJobResult | null> {
  const { pool, config, job, input, robot } = options;
  if (!job) return null;

  if (job.status === "running") {
    return { job: pgSyncJobRowToView(job), reused: true };
  }

  if (job.status !== "queued") {
    return { job: pgSyncJobRowToView(job), reused: true };
  }

  const passwordEnc = await resolveCloudPasswordEnc(input);
  try {
    await dispatchAsyncJobToWorker({
      config,
      jobId: job.id,
      robot,
      username: input.username,
      passwordEnc,
      mode: input.mode,
    });
  } catch (error) {
    await markCloudJobDispatchFailed(pool, job.id);
    throw error;
  }

  const refreshed = (await pgFindSyncJobById(pool, job.id)) ?? job;
  return { job: pgSyncJobRowToView(refreshed), reused: true };
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
  await pgReclaimStaleSyncJobs(pool);

  const robot = input.robot ?? "r1";

  if (input.idempotencyKey) {
    const existingByKey = await pgFindActiveSyncJobByIdempotencyKey(
      pool,
      input.idempotencyKey
    );
    const reused = await reuseOrRedispatchActiveJob({
      pool,
      config,
      job: existingByKey,
      input,
      robot: existingByKey?.robot ?? robot,
    });
    if (reused) return reused;
  }

  // Reuso por usuário só vale para o pipeline r1 — jobs de catálogo (turmas/
  // calendário) usam a credencial de um CPF elegível e não devem colidir.
  if (robot === "r1") {
    const activeJob = await pgFindActiveSyncJobByUsername(
      pool,
      input.username
    );
    const reused = await reuseOrRedispatchActiveJob({
      pool,
      config,
      job: activeJob,
      input,
      robot,
    });
    if (reused) return reused;
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
    await markCloudJobDispatchFailed(pool, jobId);
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
  robot?: import("@/lib/worker/job-types").WorkerRobotId;
}): Promise<{
  steps: Array<{ label: string; progress: number }>;
  partial?: boolean;
  jobId: string;
  payload?: unknown;
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
        robot: input.robot ?? "r1",
        username: input.username,
        passwordEnc,
        mode: input.mode,
        savePassword: false,
        execution: "sync",
      }),
    });
  } catch (err) {
    console.error("[cloud-sync] Erro de rede no direct sync:", err);
    throw new ApiError(
      "SIGAA_OFFLINE",
      `Worker de sincronização inacessível (${err instanceof Error ? err.message : String(err)}).`,
      503
    );
  }

  const rawText = await response.text().catch(() => "");
  let payload: {
    status?: string;
    steps?: Array<{ label: string; progress: number }>;
    partial?: boolean;
    payload?: unknown;
    error?: { code: string; message: string };
    message?: string;
    code?: string;
  } | null = null;

  try {
    payload = JSON.parse(rawText);
  } catch {}

  if (!response.ok || payload?.status !== "completed") {
    const code = payload?.error?.code ?? payload?.code ?? "SIGAA_OFFLINE";
    const message =
      payload?.error?.message ??
      payload?.message ??
      (rawText ? rawText.slice(0, 150) : `Falha no worker (HTTP ${response.status})`);
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
    payload: payload.payload,
  };
}

export async function getCloudSyncJobView(
  jobId: string,
  requesterUsername?: string | null
): Promise<SyncQueueJobView> {
  const pool = getPostgresPool();
  await pgReclaimStaleSyncJobs(pool);
  const row = await pgFindSyncJobById(pool, jobId);

  // Escopo por usuário: não vaza status/CPF de jobs de terceiros.
  const requester = requesterUsername?.trim();
  if (!row || (requester && row.username !== requester)) {
    throw notFoundError("Job de sync não encontrado.");
  }

  return pgSyncJobRowToView(row);
}
