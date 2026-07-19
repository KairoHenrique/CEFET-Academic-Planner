import AsyncStorage from "@react-native-async-storage/async-storage";

const DISMISSED_VERSION_KEY = "acme.hub.update.dismissedVersion";

/** Snooze só nesta sessão do processo (some ao matar o app). */
let sessionSnoozed = false;

export function isUpdateSessionSnoozed(): boolean {
  return sessionSnoozed;
}

export function snoozeUpdateForSession(): void {
  sessionSnoozed = true;
}

export async function getDismissedUpdateVersion(): Promise<string | null> {
  try {
    const value = await AsyncStorage.getItem(DISMISSED_VERSION_KEY);
    return value?.trim() || null;
  } catch {
    return null;
  }
}

export async function dismissUpdateVersion(version: string): Promise<void> {
  const trimmed = version.trim();
  if (!trimmed) return;
  await AsyncStorage.setItem(DISMISSED_VERSION_KEY, trimmed);
}

export async function clearDismissedUpdateVersion(): Promise<void> {
  await AsyncStorage.removeItem(DISMISSED_VERSION_KEY);
}
