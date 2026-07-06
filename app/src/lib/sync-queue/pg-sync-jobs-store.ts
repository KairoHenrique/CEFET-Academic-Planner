import type pg from "pg";
import type { SyncMode } from "@/lib/types/sync-pipeline";
import type {
  SyncJobStatus,
  SyncQueueJobView,
  SyncQueueLane,
} from "@/lib/sync-queue/types";
import { SYNC_QUEUE_DEFAULT_ETA_SECONDS } from "@/lib/sync-queue/types";

/**
 * Fila de sync no Postgres (B72e) — compartilhada entre o app cloud
 * (insere/lê) e o worker Playwright hospedado (claim/finish).
 *
 * Sem credenciais persistidas: a senha selada viaja só no dispatch HTTPS.
 */

export type PgSyncJobRobot = "r1" | "turmas" | "calendario";

export interface PgSyncJobRow {
  id: string;
  username: string;
  lane: SyncQueueLane;
  trigger_source: "first_login" | "manual" | "auto";
  mode: SyncMode;
  status: SyncJobStatus;
  robot: PgSyncJobRobot;
  idempotency_key: string | null;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
  result_json: unknown;
  error_code: string | null;
  error_message: string | null;
  queue_position: string | number | null;
}

export interface PgInsertSyncJobInput {
  id: string;
  username: string;
  lane: SyncQueueLane;
  trigger: "first_login" | "manual" | "auto";
  mode: SyncMode;
  robot?: PgSyncJobRobot;
  idempotencyKey?: string | null;
}

export interface PgSyncJobResultPayload {
  steps: Array<{ label: string; progress: number }>;
  partial?: boolean;
}

const SELECT_JOB_SQL = `
  SELECT j.*,
    CASE WHEN j.status = 'queued' THEN (
      SELECT count(*) FROM sync_jobs q
      WHERE q.status = 'queued' AND q.created_at < j.created_at
    ) ELSE 0 END AS queue_position
  FROM sync_jobs j
`;

function parseResultJson(raw: unknown): SyncQueueJobView["result"] {
  const parsed =
    typeof raw === "string" ? safeJsonParse(raw) : (raw as object | null);
  if (!parsed || typeof parsed !== "object") return undefined;

  const candidate = parsed as PgSyncJobResultPayload;
  if (!Array.isArray(candidate.steps)) return undefined;

  return { steps: candidate.steps, partial: candidate.partial };
}

function safeJsonParse(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function toIso(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toISOString();
}

export function pgSyncJobRowToView(row: PgSyncJobRow): SyncQueueJobView {
  const position =
    row.status === "queued" ? Number(row.queue_position ?? 0) + 1 : 0;

  const view: SyncQueueJobView = {
    jobId: row.id,
    username: row.username,
    lane: row.lane,
    trigger: row.trigger_source,
    mode: row.mode,
    status: row.status,
    position,
    etaSeconds:
      row.status === "queued" || row.status === "running"
        ? SYNC_QUEUE_DEFAULT_ETA_SECONDS * Math.max(position, 1)
        : 0,
    createdAt: toIso(row.created_at) ?? row.created_at,
    startedAt: toIso(row.started_at),
    finishedAt: toIso(row.finished_at),
  };

  if (row.status === "completed") {
    view.result = parseResultJson(row.result_json);
  }

  if (row.status === "failed" && row.error_code) {
    view.error = {
      code: row.error_code,
      message: row.error_message ?? "Falha no sync.",
    };
  }

  return view;
}

export async function pgFindSyncJobById(
  pool: pg.Pool,
  jobId: string
): Promise<PgSyncJobRow | null> {
  const result = await pool.query<PgSyncJobRow>(
    `${SELECT_JOB_SQL} WHERE j.id = $1 LIMIT 1`,
    [jobId]
  );
  return result.rows[0] ?? null;
}

/** Job r1 ativo do usuário — catálogo (turmas/calendário) não conta. */
export async function pgFindActiveSyncJobByUsername(
  pool: pg.Pool,
  username: string
): Promise<PgSyncJobRow | null> {
  const result = await pool.query<PgSyncJobRow>(
    `${SELECT_JOB_SQL}
     WHERE j.username = $1 AND j.robot = 'r1'
       AND j.status IN ('queued', 'running')
     ORDER BY j.created_at DESC
     LIMIT 1`,
    [username]
  );
  return result.rows[0] ?? null;
}

export async function pgFindActiveSyncJobByIdempotencyKey(
  pool: pg.Pool,
  idempotencyKey: string
): Promise<PgSyncJobRow | null> {
  const result = await pool.query<PgSyncJobRow>(
    `${SELECT_JOB_SQL}
     WHERE j.idempotency_key = $1 AND j.status IN ('queued', 'running')
     LIMIT 1`,
    [idempotencyKey]
  );
  return result.rows[0] ?? null;
}

export async function pgInsertSyncJob(
  pool: pg.Pool,
  input: PgInsertSyncJobInput
): Promise<PgSyncJobRow> {
  await pool.query(
    `INSERT INTO sync_jobs (
       id, username, lane, trigger_source, mode, robot, idempotency_key
     ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      input.id,
      input.username,
      input.lane,
      input.trigger,
      input.mode,
      input.robot ?? "r1",
      input.idempotencyKey ?? null,
    ]
  );

  const created = await pgFindSyncJobById(pool, input.id);
  if (!created) {
    throw new Error("Falha ao persistir job na fila Postgres.");
  }
  return created;
}

/** Claim atômico queued→running — evita corrida entre réplicas do worker. */
export async function pgClaimSyncJob(
  pool: pg.Pool,
  jobId: string
): Promise<boolean> {
  const result = await pool.query(
    `UPDATE sync_jobs
     SET status = 'running', started_at = now()
     WHERE id = $1 AND status = 'queued'`,
    [jobId]
  );
  return (result.rowCount ?? 0) > 0;
}

export async function pgCompleteSyncJob(
  pool: pg.Pool,
  jobId: string,
  result: PgSyncJobResultPayload
): Promise<void> {
  await pool.query(
    `UPDATE sync_jobs
     SET status = 'completed', finished_at = now(), result_json = $2::jsonb,
         error_code = NULL, error_message = NULL
     WHERE id = $1`,
    [jobId, JSON.stringify(result)]
  );
}

export async function pgFailSyncJob(
  pool: pg.Pool,
  jobId: string,
  error: { code: string; message: string }
): Promise<void> {
  await pool.query(
    `UPDATE sync_jobs
     SET status = 'failed', finished_at = now(),
         error_code = $2, error_message = $3
     WHERE id = $1`,
    [jobId, error.code, error.message.slice(0, 500)]
  );
}
