import { ApiError } from "@/lib/api/errors";
import {
  SYNC_MIN_INTERVAL_MINUTES,
  getSyncLastAt,
  recordSyncCompletedAt,
} from "@/lib/sync/sync-preferences";

const MS_PER_MINUTE = 60_000;

export interface SyncRateLimitStatus {
  minIntervalMinutes: number;
  lastSyncAt: string | null;
  nextAllowedAt: string | null;
  remainingSeconds: number;
}

export function getSyncRateLimitStatus(now = Date.now()): SyncRateLimitStatus {
  const minIntervalMs = SYNC_MIN_INTERVAL_MINUTES * MS_PER_MINUTE;
  const lastSyncAt = getSyncLastAt();

  if (!lastSyncAt) {
    return {
      minIntervalMinutes: SYNC_MIN_INTERVAL_MINUTES,
      lastSyncAt: null,
      nextAllowedAt: null,
      remainingSeconds: 0,
    };
  }

  const lastMs = Date.parse(lastSyncAt);
  if (!Number.isFinite(lastMs)) {
    return {
      minIntervalMinutes: SYNC_MIN_INTERVAL_MINUTES,
      lastSyncAt: null,
      nextAllowedAt: null,
      remainingSeconds: 0,
    };
  }

  const nextAllowedMs = lastMs + minIntervalMs;
  const remainingMs = Math.max(0, nextAllowedMs - now);

  return {
    minIntervalMinutes: SYNC_MIN_INTERVAL_MINUTES,
    lastSyncAt,
    nextAllowedAt:
      remainingMs > 0 ? new Date(nextAllowedMs).toISOString() : null,
    remainingSeconds: Math.ceil(remainingMs / 1000),
  };
}

export function assertSyncRateLimit(now = Date.now()): void {
  const status = getSyncRateLimitStatus(now);
  if (status.remainingSeconds <= 0) return;

  const waitMinutes = Math.max(1, Math.ceil(status.remainingSeconds / 60));
  throw new ApiError(
    "RATE_LIMITED",
    `Aguarde ${waitMinutes} min antes de sincronizar novamente (proteção ao SIGAA).`,
    429,
    status
  );
}

export { recordSyncCompletedAt as recordSyncCompleted };
