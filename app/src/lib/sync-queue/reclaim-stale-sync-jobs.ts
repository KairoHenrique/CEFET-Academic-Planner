import type pg from "pg";
import {
  listQueuedSyncJobsOrdered,
  listRunningSyncJobs,
  markSyncJobFailed,
} from "@/lib/sync-queue/sync-queue-store";

/** Lite/auto: se não terminar em 10 min, considera travado. */
export const STALE_RUNNING_SYNC_MS = 10 * 60 * 1000;
/** Queued sem claim por 12 min (worker offline / dispatch perdido). */
export const STALE_QUEUED_SYNC_MS = 12 * 60 * 1000;

export const STALE_SYNC_ERROR = {
  code: "SIGAA_TIMEOUT",
  message:
    "Sync expirado — o job não concluiu a tempo e foi encerrado automaticamente.",
} as const;

function parseIsoMs(value: string | null | undefined): number | null {
  if (!value?.trim()) return null;
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? ms : null;
}

export function isSyncJobStale(input: {
  status: string;
  createdAt: string;
  startedAt: string | null;
  nowMs?: number;
}): boolean {
  const now = input.nowMs ?? Date.now();

  if (input.status === "running") {
    const anchor =
      parseIsoMs(input.startedAt) ?? parseIsoMs(input.createdAt) ?? now;
    return now - anchor >= STALE_RUNNING_SYNC_MS;
  }

  if (input.status === "queued") {
    const created = parseIsoMs(input.createdAt) ?? now;
    return now - created >= STALE_QUEUED_SYNC_MS;
  }

  return false;
}

/**
 * Encerra jobs Postgres órfãos (worker caiu / hung sem callback).
 * Sem isso, `pgFindActiveSyncJobByUsername` reusa o job eterno e bloqueia syncs.
 */
export async function pgReclaimStaleSyncJobs(pool: pg.Pool): Promise<number> {
  const result = await pool.query(
    `UPDATE sync_jobs
     SET status = 'failed',
         finished_at = now(),
         error_code = $1,
         error_message = $2
     WHERE status IN ('queued', 'running')
       AND (
         (status = 'running'
           AND COALESCE(started_at, created_at)
             < now() - make_interval(secs => $3::double precision / 1000.0))
         OR
         (status = 'queued'
           AND created_at
             < now() - make_interval(secs => $4::double precision / 1000.0))
       )`,
    [
      STALE_SYNC_ERROR.code,
      STALE_SYNC_ERROR.message,
      STALE_RUNNING_SYNC_MS,
      STALE_QUEUED_SYNC_MS,
    ]
  );

  const count = result.rowCount ?? 0;
  if (count > 0) {
    console.warn(
      `[sync-queue] Reclaimou ${count} job(s) stale (timeout ${STALE_RUNNING_SYNC_MS / 60000} min running / ${STALE_QUEUED_SYNC_MS / 60000} min queued).`
    );
  }
  return count;
}

/** Mesma política para a fila SQLite local. */
export function reclaimStaleSqliteSyncJobs(nowMs = Date.now()): number {
  const nowIso = new Date(nowMs).toISOString();
  let count = 0;

  for (const job of listRunningSyncJobs()) {
    if (
      isSyncJobStale({
        status: job.status,
        createdAt: job.createdAt,
        startedAt: job.startedAt,
        nowMs,
      })
    ) {
      markSyncJobFailed(
        job.id,
        nowIso,
        STALE_SYNC_ERROR.code,
        STALE_SYNC_ERROR.message
      );
      count += 1;
    }
  }

  for (const job of listQueuedSyncJobsOrdered()) {
    if (
      isSyncJobStale({
        status: job.status,
        createdAt: job.createdAt,
        startedAt: job.startedAt,
        nowMs,
      })
    ) {
      markSyncJobFailed(
        job.id,
        nowIso,
        STALE_SYNC_ERROR.code,
        STALE_SYNC_ERROR.message
      );
      count += 1;
    }
  }

  if (count > 0) {
    console.warn(`[sync-queue] Reclaimou ${count} job(s) stale (SQLite).`);
  }
  return count;
}
