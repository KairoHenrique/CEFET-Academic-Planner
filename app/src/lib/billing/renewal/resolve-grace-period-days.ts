const DEFAULT_GRACE_PERIOD_DAYS = 3;

export function resolveGracePeriodDays(
  env: NodeJS.ProcessEnv = process.env
): number {
  const raw = env.BILLING_GRACE_PERIOD_DAYS?.trim();
  if (!raw) {
    return DEFAULT_GRACE_PERIOD_DAYS;
  }

  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return DEFAULT_GRACE_PERIOD_DAYS;
  }

  return parsed;
}

export function computeGracePeriodEndsAt(
  subscriptionExpiresAt: string,
  graceDays: number
): Date {
  const base = Date.parse(subscriptionExpiresAt);
  return new Date(base + graceDays * 24 * 60 * 60 * 1000);
}

export function isWithinGracePeriod(
  subscriptionExpiresAt: string,
  graceDays: number,
  now = new Date()
): boolean {
  const expiresAt = Date.parse(subscriptionExpiresAt);
  if (expiresAt > now.getTime()) {
    return false;
  }

  const graceEndsAt = computeGracePeriodEndsAt(
    subscriptionExpiresAt,
    graceDays
  );
  return graceEndsAt.getTime() > now.getTime();
}
