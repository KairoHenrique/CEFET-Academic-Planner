import { clearSyncCredentials } from "@/lib/auth/credentials";
import type { AppCursoId } from "@/lib/auth/account/types";

const SESSION_KEY = "academic-planner-session";

export type AuthSessionMode = "sigaa" | "cloud";

export interface AuthSession {
  username: string;
  savePassword: boolean;
  loggedAt: string;
  mode?: AuthSessionMode;
  cpf?: string;
  email?: string;
  cursoId?: AppCursoId;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
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
  clearSyncCredentials();
}

export function isAuthenticated(): boolean {
  const session = getSession();
  if (!session) return false;

  if (session.mode === "cloud") {
    return Boolean(session.accessToken?.trim());
  }

  return Boolean(session.username?.trim());
}

export function isCloudSession(session: AuthSession | null = getSession()): boolean {
  return session?.mode === "cloud";
}
