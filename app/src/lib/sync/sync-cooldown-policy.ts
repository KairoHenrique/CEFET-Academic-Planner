/** Cooldown manual entre pedidos na fila (anti-spam). */
export const SYNC_MANUAL_COOLDOWN_MS = 5 * 60 * 1000;

/** Alias usado pela fila B55. */
export const SYNC_QUEUE_MANUAL_COOLDOWN_MS = SYNC_MANUAL_COOLDOWN_MS;

/** Dev local — intervalo legado B65 até F19 migrar auto-sync para fila. */
export const SYNC_AUTO_INTERVAL_DEV_MINUTES = 30;

/** Produção O3 — mínimo 3h entre syncs automáticos concluídos por usuário. */
export const SYNC_AUTO_INTERVAL_PROD_MINUTES = 180;

export function isProductionCooldownProfile(): boolean {
  const profile = process.env.SYNC_COOLDOWN_PROFILE?.trim().toLowerCase();
  if (profile === "production") return true;
  if (profile === "development" || profile === "dev") return false;
  return process.env.NODE_ENV === "production";
}

export function getSyncAutoIntervalMinutes(): number {
  const override = process.env.SYNC_AUTO_INTERVAL_MINUTES?.trim();
  if (override) {
    const parsed = Number.parseInt(override, 10);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }

  return isProductionCooldownProfile()
    ? SYNC_AUTO_INTERVAL_PROD_MINUTES
    : SYNC_AUTO_INTERVAL_DEV_MINUTES;
}

export function getSyncAutoCooldownMs(): number {
  return getSyncAutoIntervalMinutes() * 60_000;
}

export function msUntilAutoSyncEligible(lastSyncAt: string | null): number {
  if (!lastSyncAt) return 0;

  const lastMs = Date.parse(lastSyncAt);
  if (!Number.isFinite(lastMs)) return 0;

  const remaining = getSyncAutoCooldownMs() - (Date.now() - lastMs);
  return remaining > 0 ? remaining : 0;
}

export function isAutoSyncEligible(lastSyncAt: string | null): boolean {
  return msUntilAutoSyncEligible(lastSyncAt) === 0;
}

export function msUntilManualSyncEligible(lastManualEnqueueAt: string | null): number {
  if (!lastManualEnqueueAt) return 0;

  const lastMs = Date.parse(lastManualEnqueueAt);
  if (!Number.isFinite(lastMs)) return 0;

  const remaining = SYNC_MANUAL_COOLDOWN_MS - (Date.now() - lastMs);
  return remaining > 0 ? remaining : 0;
}

export function isManualSyncEligible(lastManualEnqueueAt: string | null): boolean {
  return msUntilManualSyncEligible(lastManualEnqueueAt) === 0;
}
