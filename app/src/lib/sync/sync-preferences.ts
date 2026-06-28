import { getConfig, setConfig } from "@/lib/db/queries";

export const CONFIG_SYNC_AUTO_ENABLED = "sync.auto_enabled";
export const CONFIG_SYNC_AUTO_INTERVAL_MIN = "sync.auto_interval_min";
export const CONFIG_SYNC_LAST_AT = "sync.last_at";

export const SYNC_MIN_INTERVAL_MINUTES = 5;
export const SYNC_AUTO_INTERVAL_OPTIONS = [15, 30, 60, 120] as const;
export type SyncAutoIntervalMinutes = (typeof SYNC_AUTO_INTERVAL_OPTIONS)[number];

export interface SyncPreferences {
  autoEnabled: boolean;
  intervalMinutes: SyncAutoIntervalMinutes;
}

function normalizeIntervalMinutes(value: string | null): SyncAutoIntervalMinutes {
  const parsed = Number(value ?? 30);
  const allowed = SYNC_AUTO_INTERVAL_OPTIONS as readonly number[];
  if (allowed.includes(parsed)) {
    return parsed as SyncAutoIntervalMinutes;
  }
  return 30;
}

export function getSyncPreferences(): SyncPreferences {
  return {
    autoEnabled: getConfig(CONFIG_SYNC_AUTO_ENABLED) === "1",
    intervalMinutes: normalizeIntervalMinutes(
      getConfig(CONFIG_SYNC_AUTO_INTERVAL_MIN)
    ),
  };
}

export function saveSyncPreferences(prefs: SyncPreferences): void {
  setConfig(CONFIG_SYNC_AUTO_ENABLED, prefs.autoEnabled ? "1" : "0");
  setConfig(CONFIG_SYNC_AUTO_INTERVAL_MIN, String(prefs.intervalMinutes));
}

export function getSyncLastAt(): string | null {
  return getConfig(CONFIG_SYNC_LAST_AT);
}

export function recordSyncCompletedAt(isoTimestamp = new Date().toISOString()): void {
  setConfig(CONFIG_SYNC_LAST_AT, isoTimestamp);
}
