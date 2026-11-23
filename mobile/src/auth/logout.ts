/**
 * Logout local (M4/M5/M6): push token + cache acadêmico + sessão.
 * Separado de `api.ts` para evitar ciclo require com `push/register`.
 */
import { clearAllAcademicCaches } from "../cache/academic-cache";
import { clearAvatarInitials } from "../perfil/avatar-store";
import { unregisterPushForCurrentSession } from "../push/register";
import { clearSession } from "./session";

export async function clearLocalAppData(): Promise<void> {
  await clearAllAcademicCaches();
  await clearAvatarInitials();
}

export async function logoutLocal(): Promise<void> {
  await unregisterPushForCurrentSession();
  await clearLocalAppData();
  await clearSession();
}
