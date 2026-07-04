import { getConfig, setConfig } from "@/lib/db/queries";

export const CONFIG_SYNC_LAST_AT = "sync.last_at";
export const CONFIG_SYNC_USERNAME = "sync.username";
export const CONFIG_SYNC_HISTORICO_AT = "sync.historico_at";
export const CONFIG_SYNC_CALENDARIO_AT = "sync.calendario_at";
export const CONFIG_SYNC_TURMAS_AT = "sync.turmas_at";

/** Intervalo entre syncs automáticos — ver sync-cooldown-policy (O3). */
export { getSyncAutoIntervalMinutes } from "@/lib/sync/sync-cooldown-policy";

/** Dev legado — preferir getSyncAutoIntervalMinutes() (O3). */
export const SYNC_AUTO_INTERVAL_MINUTES = 30;

/** Histórico PDF muda pouco — no incremental, re-raspa após este intervalo. */
export const SYNC_HISTORICO_REFRESH_MS = 24 * 60 * 60 * 1000;

/** Calendário acadêmico — publicação periódica (início/fim de semestre). */
export const SYNC_CALENDARIO_REFRESH_MS = 7 * 24 * 60 * 60 * 1000;

/** Turmas ofertadas — oferta institucional muda com menos frequência intra-dia. */
export const SYNC_TURMAS_OFERTADAS_REFRESH_MS = 24 * 60 * 60 * 1000;

export function getSyncLastAt(): string | null {
  const value = getConfig(CONFIG_SYNC_LAST_AT);
  return value?.trim() ? value : null;
}

export function getSyncedUsername(): string | null {
  const value = getConfig(CONFIG_SYNC_USERNAME);
  return value?.trim() ? value : null;
}

export function getHistoricoLastAt(): string | null {
  const value = getConfig(CONFIG_SYNC_HISTORICO_AT);
  return value?.trim() ? value : null;
}

export function recordSyncCompletedAt(isoTimestamp = new Date().toISOString()): void {
  setConfig(CONFIG_SYNC_LAST_AT, isoTimestamp);
}

export function recordSyncedUsername(username: string): void {
  setConfig(CONFIG_SYNC_USERNAME, username.trim());
}

export function recordHistoricoSyncedAt(isoTimestamp = new Date().toISOString()): void {
  setConfig(CONFIG_SYNC_HISTORICO_AT, isoTimestamp);
}

export function getCalendarioLastAt(): string | null {
  const value = getConfig(CONFIG_SYNC_CALENDARIO_AT);
  return value?.trim() ? value : null;
}

export function recordCalendarioSyncedAt(isoTimestamp = new Date().toISOString()): void {
  setConfig(CONFIG_SYNC_CALENDARIO_AT, isoTimestamp);
}

export function getTurmasOfertadasLastAt(): string | null {
  const value = getConfig(CONFIG_SYNC_TURMAS_AT);
  return value?.trim() ? value : null;
}

export function recordTurmasOfertadasSyncedAt(
  isoTimestamp = new Date().toISOString()
): void {
  setConfig(CONFIG_SYNC_TURMAS_AT, isoTimestamp);
}

export function clearSyncLastAt(): void {
  setConfig(CONFIG_SYNC_LAST_AT, "");
}

export function shouldRefreshHistoricoOnIncremental(): boolean {
  const lastAt = getHistoricoLastAt();
  if (!lastAt) return true;

  const lastMs = Date.parse(lastAt);
  if (!Number.isFinite(lastMs)) return true;

  return Date.now() - lastMs >= SYNC_HISTORICO_REFRESH_MS;
}

export function shouldRefreshCalendarioOnSchedule(): boolean {
  const lastAt = getCalendarioLastAt();
  if (!lastAt) return true;

  const lastMs = Date.parse(lastAt);
  if (!Number.isFinite(lastMs)) return true;

  return Date.now() - lastMs >= SYNC_CALENDARIO_REFRESH_MS;
}

export function shouldRefreshTurmasOfertadasOnSchedule(): boolean {
  const lastAt = getTurmasOfertadasLastAt();
  if (!lastAt) return true;

  const lastMs = Date.parse(lastAt);
  if (!Number.isFinite(lastMs)) return true;

  return Date.now() - lastMs >= SYNC_TURMAS_OFERTADAS_REFRESH_MS;
}
