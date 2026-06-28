import { getConfig, setConfig } from "@/lib/db/queries";

export const CONFIG_SYNC_LAST_AT = "sync.last_at";

/** Intervalo entre syncs automáticos da plataforma (fixo — não configurável pelo aluno). */
export const SYNC_AUTO_INTERVAL_MINUTES = 30;

export function getSyncAutoIntervalMinutes(): number {
  return SYNC_AUTO_INTERVAL_MINUTES;
}

export function getSyncLastAt(): string | null {
  const value = getConfig(CONFIG_SYNC_LAST_AT);
  return value?.trim() ? value : null;
}

export function recordSyncCompletedAt(isoTimestamp = new Date().toISOString()): void {
  setConfig(CONFIG_SYNC_LAST_AT, isoTimestamp);
}

export function clearSyncLastAt(): void {
  setConfig(CONFIG_SYNC_LAST_AT, "");
}
