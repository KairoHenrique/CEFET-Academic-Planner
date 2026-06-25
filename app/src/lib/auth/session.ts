const SESSION_KEY = "academic-planner-session";

export interface AuthSession {
  username: string;
  savePassword: boolean;
  loggedAt: string;
}

export function getSession(): AuthSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as AuthSession) : null;
  } catch {
    return null;
  }
}

export function setSession(session: AuthSession) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

export function isAuthenticated(): boolean {
  return Boolean(getSession());
}
