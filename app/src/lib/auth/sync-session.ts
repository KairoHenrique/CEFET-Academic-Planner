/** Senha SIGAA na sessão do browser (tab) — expira após inatividade. */
export const SYNC_SESSION_IDLE_MS = 30 * 60 * 1000;

const SESSION_PASSWORD_KEY = "academic-planner-sync-session-password";
const SESSION_ACTIVITY_KEY = "academic-planner-sync-last-activity";

export function touchSyncActivity(): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(SESSION_ACTIVITY_KEY, String(Date.now()));
}

export function clearSessionPassword(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(SESSION_PASSWORD_KEY);
  sessionStorage.removeItem(SESSION_ACTIVITY_KEY);
}

export function saveSessionPassword(password: string): void {
  if (typeof window === "undefined" || !password.trim()) return;
  sessionStorage.setItem(SESSION_PASSWORD_KEY, password);
  touchSyncActivity();
}

export function readSessionPassword(): string {
  if (typeof window === "undefined") return "";
  if (isSessionIdleExpired()) {
    clearSessionPassword();
    return "";
  }
  return sessionStorage.getItem(SESSION_PASSWORD_KEY) ?? "";
}

export function isSessionIdleExpired(): boolean {
  if (typeof window === "undefined") return false;

  const raw = sessionStorage.getItem(SESSION_ACTIVITY_KEY);
  if (!raw) return false;

  const lastActivity = Number(raw);
  if (!Number.isFinite(lastActivity)) return false;

  return Date.now() - lastActivity > SYNC_SESSION_IDLE_MS;
}

export function needsSyncPassword(username: string | null | undefined): boolean {
  if (!username?.trim()) return true;
  return readSessionPassword().trim().length === 0;
}
