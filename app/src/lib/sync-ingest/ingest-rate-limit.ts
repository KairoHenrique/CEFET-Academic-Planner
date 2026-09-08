import { ApiError } from "@/lib/api/errors";

const attempts = new Map<string, number[]>();

const MAX_ATTEMPTS = 6;
const WINDOW_MS = 15 * 60 * 1000;

/** Rate limit por user_id para `POST /api/sync/ingest` (anti-abuso). */
export function assertSyncIngestRateLimit(userId: string): void {
  const now = Date.now();
  const history = attempts.get(userId) ?? [];
  const recent = history.filter((timestamp) => now - timestamp <= WINDOW_MS);

  if (recent.length >= MAX_ATTEMPTS) {
    throw new ApiError(
      "RATE_LIMITED",
      "Muitas sincronizações pelo aparelho. Aguarde alguns minutos.",
      429
    );
  }

  recent.push(now);
  attempts.set(userId, recent);
}

export function resetSyncIngestRateLimitForTests(): void {
  attempts.clear();
}
