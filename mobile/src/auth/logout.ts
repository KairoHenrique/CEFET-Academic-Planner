/**
 * Limpa dados locais no logout (M4+).
 * M5: snapshot acadêmico · M6: token push (quando existir).
 */
import { clearAllAcademicCaches } from "../cache/academic-cache";

export async function clearLocalAppData(): Promise<void> {
  await clearAllAcademicCaches();
  try {
    const SecureStore = await import("expo-secure-store");
    await SecureStore.deleteItemAsync("acme-hub.push.token").catch(() => undefined);
  } catch {
    // SecureStore pode falhar em ambientes sem native — ignore.
  }
}
