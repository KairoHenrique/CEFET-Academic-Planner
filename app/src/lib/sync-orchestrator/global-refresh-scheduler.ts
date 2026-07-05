import type { GlobalRefreshPolicy } from "@/lib/sync-policy/types";

function parseTimestamp(iso: string | null | undefined): number | null {
  if (!iso?.trim()) return null;
  const ms = Date.parse(iso);
  return Number.isFinite(ms) ? ms : null;
}

export function isGlobalRefreshDue(
  policy: GlobalRefreshPolicy,
  lastRunAt: string | null | undefined,
  now: Date,
  force = false
): boolean {
  if (force) return true;

  const lastMs = parseTimestamp(lastRunAt);
  if (lastMs === null) return true;

  if (policy.mode === "fixed_at" && policy.at) {
    const targetMs = Date.parse(policy.at);
    if (!Number.isFinite(targetMs)) return false;
    if (now.getTime() < targetMs) return false;
    return lastMs < targetMs;
  }

  const days = policy.days ?? 1;
  const intervalMs = days * 24 * 60 * 60 * 1000;
  return now.getTime() - lastMs >= intervalMs;
}

export function msUntilGlobalRefresh(
  policy: GlobalRefreshPolicy,
  lastRunAt: string | null | undefined,
  now: Date
): number {
  const lastMs = parseTimestamp(lastRunAt);
  if (lastMs === null) return 0;

  if (policy.mode === "fixed_at" && policy.at) {
    const targetMs = Date.parse(policy.at);
    if (!Number.isFinite(targetMs)) return 0;
    return Math.max(0, targetMs - now.getTime());
  }

  const days = policy.days ?? 1;
  const intervalMs = days * 24 * 60 * 60 * 1000;
  return Math.max(0, intervalMs - (now.getTime() - lastMs));
}
