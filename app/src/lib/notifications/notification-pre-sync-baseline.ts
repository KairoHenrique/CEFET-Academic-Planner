import { getSession } from "@/lib/auth/session";

const STORAGE_PREFIX = "planner:notifications:pre-sync:";

function storageKey(): string | null {
  const username = getSession()?.username?.trim();
  if (!username) return null;
  return `${STORAGE_PREFIX}${username}`;
}

/** Guarda fingerprints conhecidas antes do sync para não marcar notas novas como lidas. */
export function capturePreSyncNotificationBaseline(fingerprints: string[]): void {
  const key = storageKey();
  if (!key || typeof window === "undefined") return;
  sessionStorage.setItem(key, JSON.stringify(fingerprints));
}

/** Lê e remove o snapshot pré-sync (consumido uma vez após o sync). */
export function consumePreSyncNotificationBaseline(): string[] | null {
  const key = storageKey();
  if (!key || typeof window === "undefined") return null;

  const raw = sessionStorage.getItem(key);
  sessionStorage.removeItem(key);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
