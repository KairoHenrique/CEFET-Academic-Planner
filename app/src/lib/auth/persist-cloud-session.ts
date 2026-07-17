import type { AccountAuthResult } from "@/lib/auth/account/types";
import { markBackgroundSyncPending } from "@/lib/auth/background-sync";
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
  // Agenda o sync de entrada (consumido por useAutoSync); no cloud a senha
  // SIGAA está no servidor, então o sync roda sem credencial local.
  markBackgroundSyncPending();
  return session;
}
