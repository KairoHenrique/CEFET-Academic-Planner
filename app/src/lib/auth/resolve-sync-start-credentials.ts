import { getSyncCredentials } from "@/lib/auth/credentials";
import { getSession, isCloudSession } from "@/lib/auth/session";
import type { SyncRequest } from "@/lib/types/sync";

/**
 * Resolve as credenciais usadas para disparar um sync no client.
 *
 * No deploy cloud a identidade é a sessão autenticada (CPF) e a senha SIGAA
 * vive no servidor (`app_profiles.sigaa_password_enc`) — o client não precisa
 * (nem deve) reter a senha. Por isso, quando não há perfil de sync local,
 * derivamos as credenciais da sessão cloud com senha vazia; o servidor usa a
 * senha selada. No modo SIGAA (legado/local) mantemos o storage de sync.
 */
export function resolveSyncStartCredentials(
  explicit?: SyncRequest
): SyncRequest | null {
  if (explicit) return explicit;

  const stored = getSyncCredentials();
  if (stored?.username) return stored;

  const session = getSession();
  if (isCloudSession(session) && session?.username?.trim()) {
    return {
      username: session.username.trim(),
      password: "",
      savePassword: false,
    };
  }

  return null;
}
