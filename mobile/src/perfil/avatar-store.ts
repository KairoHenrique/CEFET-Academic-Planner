import AsyncStorage from "@react-native-async-storage/async-storage";
import { buildInitials } from "../lib/build-initials";

const STORAGE_KEY = "acme-hub.avatar-initials";

let memoryInitials = "";
const listeners = new Set<(initials: string) => void>();

function sanitizeInitials(raw: string | null | undefined): string {
  const value = raw?.trim().slice(0, 3).toUpperCase() ?? "";
  if (!value || value === "?" || value === "??") return "";
  return value;
}

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
    const cleaned = sanitizeInitials(raw);
    if (cleaned) {
      memoryInitials = cleaned;
      emit();
    }
  } catch {
    /* ignore */
  }
  return memoryInitials;
}

export async function setAvatarInitials(next: string): Promise<void> {
  const value = sanitizeInitials(next);
  memoryInitials = value;
  emit();
  try {
    if (value) {
      await AsyncStorage.setItem(STORAGE_KEY, value);
    } else {
      await AsyncStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    /* ignore */
  }
}

export async function clearAvatarInitials(): Promise<void> {
  memoryInitials = "";
  emit();
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export async function setAvatarFromNome(nome: string | null | undefined): Promise<void> {
  if (!nome?.trim()) return;
  await setAvatarInitials(buildInitials(nome));
}
