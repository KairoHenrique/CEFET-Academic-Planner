import type { AccountAuthResult } from "@/lib/auth/account/types";
import { setSession, type AuthSession } from "@/lib/auth/session";

export function persistCloudAuthSession(result: AccountAuthResult): AuthSession {
  const session: AuthSession = {
    mode: "cloud",
    username: result.profile.cpf,
    cpf: result.profile.cpf,
    email: result.profile.email,
    cursoId: result.profile.cursoId,
    savePassword: false,
    loggedAt: new Date().toISOString(),
    accessToken: result.session.accessToken,
    refreshToken: result.session.refreshToken,
    expiresAt: result.session.expiresAt,
  };
  setSession(session);
  return session;
}
