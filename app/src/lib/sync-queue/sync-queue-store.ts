import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import type { SyncQueueJobRecord } from "@/lib/sync-queue/types";

let queueDb: Database.Database | null = null;

function resolveQueueDbPath(): string {
  if (process.env.SYNC_QUEUE_DB_PATH?.trim()) {
    return process.env.SYNC_QUEUE_DB_PATH.trim();
  }

  const root = process.env.PLANNER_DATA_ROOT?.trim() || path.join(process.cwd(), ".data");
  return path.join(root, "sync-queue.db");
}

function bootstrapQueueSchema(database: Database.Database): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS sync_jobs (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL,
      lane TEXT NOT NULL CHECK (lane IN ('priority', 'normal')),
      trigger TEXT NOT NULL CHECK (trigger IN ('first_login', 'manual', 'auto')),
      mode TEXT NOT NULL CHECK (mode IN ('full', 'incremental')),
      status TEXT NOT NULL CHECK (status IN ('queued', 'running', 'completed', 'failed')),
      save_password INTEGER NOT NULL DEFAULT 0,
      idempotency_key TEXT,
      password_enc TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      started_at TEXT,
      finished_at TEXT,
      result_json TEXT,
      error_code TEXT,
      error_message TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_sync_jobs_status_created
      ON sync_jobs(status, lane, created_at);

    CREATE INDEX IF NOT EXISTS idx_sync_jobs_username_status
      ON sync_jobs(username, status, created_at DESC);

    CREATE UNIQUE INDEX IF NOT EXISTS idx_sync_jobs_idempotency_active
      ON sync_jobs(idempotency_key)
      WHERE idempotency_key IS NOT NULL
        AND status IN ('queued', 'running');
  `);
}

export function getSyncQueueDatabase(): Database.Database {
  if (queueDb) return queueDb;

  const dbPath = resolveQueueDbPath();
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  queueDb = new Database(dbPath);
  queueDb.pragma("journal_mode = WAL");
  bootstrapQueueSchema(queueDb);
  return queueDb;
}

export function resetSyncQueueDatabaseForTests(): void {
  if (queueDb) {
    queueDb.close();
    queueDb = null;
  }

  const dbPath = resolveQueueDbPath();
  try {
    fs.rmSync(dbPath, { force: true });
  } catch {
    // ignore
  }
}

function mapRow(row: Record<string, unknown>): SyncQueueJobRecord {
  return {
    id: String(row.id),
    username: String(row.username),
    lane: row.lane as SyncQueueJobRecord["lane"],
    trigger: row.trigger as SyncQueueJobRecord["trigger"],
    mode: row.mode as SyncQueueJobRecord["mode"],
    status: row.status as SyncQueueJobRecord["status"],
    savePassword: Number(row.save_password ?? 0),
    idempotencyKey:
      row.idempotency_key === null || row.idempotency_key === undefined
        ? null
        : String(row.idempotency_key),
    passwordEnc: String(row.password_enc ?? ""),
    createdAt: String(row.created_at),
    startedAt: row.started_at ? String(row.started_at) : null,
    finishedAt: row.finished_at ? String(row.finished_at) : null,
    resultJson: row.result_json ? String(row.result_json) : null,
    errorCode: row.error_code ? String(row.error_code) : null,
    errorMessage: row.error_message ? String(row.error_message) : null,
  };
}

export function insertSyncJob(record: SyncQueueJobRecord): void {
  getSyncQueueDatabase()
    .prepare(
      `INSERT INTO sync_jobs (
        id, username, lane, trigger, mode, status, save_password,
        idempotency_key, password_enc, created_at, started_at, finished_at,
        result_json, error_code, error_message
      ) VALUES (
        @id, @username, @lane, @trigger, @mode, @status, @savePassword,
        @idempotencyKey, @passwordEnc, @createdAt, @startedAt, @finishedAt,
        @resultJson, @errorCode, @errorMessage
      )`
    )
    .run(record);
}

export function findSyncJobById(jobId: string): SyncQueueJobRecord | null {
  const row = getSyncQueueDatabase()
    .prepare(`SELECT * FROM sync_jobs WHERE id = ?`)
    .get(jobId) as Record<string, unknown> | undefined;

  return row ? mapRow(row) : null;
}

export function findActiveJobByIdempotencyKey(
  idempotencyKey: string
): SyncQueueJobRecord | null {
  const row = getSyncQueueDatabase()
    .prepare(
      `SELECT * FROM sync_jobs
       WHERE idempotency_key = ?
         AND status IN ('queued', 'running')
       ORDER BY created_at ASC
       LIMIT 1`
    )
    .get(idempotencyKey) as Record<string, unknown> | undefined;

  return row ? mapRow(row) : null;
}

export function findRunningSyncJob(): SyncQueueJobRecord | null {
  const row = getSyncQueueDatabase()
    .prepare(
      `SELECT * FROM sync_jobs
       WHERE status = 'running'
       ORDER BY started_at ASC
       LIMIT 1`
    )
    .get() as Record<string, unknown> | undefined;

  return row ? mapRow(row) : null;
}

export function listQueuedSyncJobsOrdered(): SyncQueueJobRecord[] {
  const rows = getSyncQueueDatabase()
    .prepare(
      `SELECT * FROM sync_jobs
       WHERE status = 'queued'
       ORDER BY
         CASE lane WHEN 'priority' THEN 0 ELSE 1 END,
         created_at ASC`
    )
    .all() as Record<string, unknown>[];

  return rows.map(mapRow);
}

export function countQueuedJobsAhead(jobId: string): number {
  const target = findSyncJobById(jobId);
  if (!target || target.status !== "queued") return 0;

  const rows = listQueuedSyncJobsOrdered();
  const index = rows.findIndex((row) => row.id === jobId);
  return index >= 0 ? index : 0;
}

export function getLatestManualEnqueueAt(username: string): string | null {
  const row = getSyncQueueDatabase()
    .prepare(
      `SELECT created_at FROM sync_jobs
       WHERE username = ?
         AND trigger = 'manual'
       ORDER BY created_at DESC
       LIMIT 1`
    )
    .get(username) as { created_at: string } | undefined;

  return row?.created_at ?? null;
}

export function markSyncJobRunning(jobId: string, startedAt: string): void {
  getSyncQueueDatabase()
    .prepare(
      `UPDATE sync_jobs
       SET status = 'running', started_at = ?
       WHERE id = ? AND status = 'queued'`
    )
    .run(startedAt, jobId);
}

export function markSyncJobCompleted(
  jobId: string,
  finishedAt: string,
  resultJson: string
): void {
  getSyncQueueDatabase()
    .prepare(
      `UPDATE sync_jobs
       SET status = 'completed',
           finished_at = ?,
           result_json = ?,
           password_enc = '',
           error_code = NULL,
           error_message = NULL
       WHERE id = ?`
    )
    .run(finishedAt, resultJson, jobId);
}

export function markSyncJobFailed(
  jobId: string,
  finishedAt: string,
  errorCode: string,
  errorMessage: string
): void {
  getSyncQueueDatabase()
    .prepare(
      `UPDATE sync_jobs
       SET status = 'failed',
           finished_at = ?,
           error_code = ?,
           error_message = ?,
           password_enc = ''
       WHERE id = ?`
    )
    .run(finishedAt, errorCode, errorMessage, jobId);
}

export function dequeueNextSyncJob(): SyncQueueJobRecord | null {
  const next = listQueuedSyncJobsOrdered()[0] ?? null;
  return next;
}
