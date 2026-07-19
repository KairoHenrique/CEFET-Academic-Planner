import AsyncStorage from "@react-native-async-storage/async-storage";
import { buildInitials } from "../lib/build-initials";

const STORAGE_KEY = "acme-hub.avatar-initials";

let memoryInitials = "??";
const listeners = new Set<(initials: string) => void>();

function emit() {
  for (const l of listeners) l(memoryInitials);
}

export function getAvatarInitials(): string {
  return memoryInitials;
}

export function subscribeAvatarInitials(
  listener: (initials: string) => void
): () => void {
  listeners.add(listener);
  listener(memoryInitials);
  return () => {
    listeners.delete(listener);
  };
}

export async function hydrateAvatarInitials(): Promise<string> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw?.trim()) {
      memoryInitials = raw.trim().slice(0, 3).toUpperCase();
      emit();
    }
  } catch {
    /* ignore */
  }
  return memoryInitials;
}

export async function setAvatarInitials(next: string): Promise<void> {
  const value = next.trim().slice(0, 3).toUpperCase() || "??";
  memoryInitials = value;
  emit();
  try {
    await AsyncStorage.setItem(STORAGE_KEY, value);
  } catch {
    /* ignore */
  }
}

export async function setAvatarFromNome(nome: string | null | undefined): Promise<void> {
  if (!nome?.trim()) return;
  await setAvatarInitials(buildInitials(nome));
}
