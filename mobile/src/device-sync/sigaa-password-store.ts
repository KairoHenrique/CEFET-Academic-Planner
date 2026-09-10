/**
 * Senha SIGAA só no SecureStore do aparelho — usada no sync quando o PC worker
 * está offline. Nunca enviada ao Cloudflare para raspar o portal.
 */

const KEY = "acme.sigaa.password";

export async function saveSigaaPassword(password: string): Promise<void> {
  const value = password.trim();
  if (!value) return;
  try {
    const SecureStore = await import("expo-secure-store");
    await SecureStore.setItemAsync(KEY, value);
  } catch {
    /* Expo Go / web */
  }
}

export async function getSigaaPassword(): Promise<string | null> {
  try {
    const SecureStore = await import("expo-secure-store");
    const value = await SecureStore.getItemAsync(KEY);
    return value?.trim() || null;
  } catch {
    return null;
  }
}

export async function clearSigaaPassword(): Promise<void> {
  try {
    const SecureStore = await import("expo-secure-store");
    await SecureStore.deleteItemAsync(KEY);
  } catch {
    /* ignore */
  }
}
