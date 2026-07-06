import { ApiError } from "@/lib/api/errors";

const attempts = new Map<string, number[]>();

function readMaxAttempts(): number {
  const raw = process.env.BILLING_REDEEM_MAX_ATTEMPTS?.trim();
  const parsed = raw ? Number.parseInt(raw, 10) : 10;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 10;
}

function readWindowMs(): number {
  const raw = process.env.BILLING_REDEEM_WINDOW_MS?.trim();
  const parsed = raw ? Number.parseInt(raw, 10) : 15 * 60 * 1000;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 15 * 60 * 1000;
}

export function assertGiftKeyRedeemRateLimit(scope: string): void {
  const now = Date.now();
  const windowMs = readWindowMs();
  const maxAttempts = readMaxAttempts();
  const history = attempts.get(scope) ?? [];
  const recent = history.filter((timestamp) => now - timestamp <= windowMs);

  if (recent.length >= maxAttempts) {
    throw new ApiError(
      "RATE_LIMITED",
      "Muitas tentativas de resgate. Aguarde alguns minutos.",
      429
    );
  }

  recent.push(now);
  attempts.set(scope, recent);
}

export function resetGiftKeyRedeemRateLimitForTests(): void {
  attempts.clear();
}
