/**
 * Limpa cache acadêmico no logout (M5).
 * Push é removido em `logoutLocal` (api) antes desta chamada.
 */
import { clearAllAcademicCaches } from "../cache/academic-cache";

export async function clearLocalAppData(): Promise<void> {
  await clearAllAcademicCaches();
}
