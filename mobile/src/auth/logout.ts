/**
 * Limpa dados locais no logout (M4).
 * Cache (M5) e push tokens (M6) encaixam aqui quando existirem.
 */
const EXTRA_KEYS: string[] = [
  // "acme-hub.cache.snapshot",
  // "acme-hub.push.token",
];

export async function clearLocalAppData(): Promise<void> {
  if (EXTRA_KEYS.length === 0) return;
  const SecureStore = await import("expo-secure-store");
  await Promise.all(
    EXTRA_KEYS.map((key) => SecureStore.deleteItemAsync(key).catch(() => undefined))
  );
}
