import type { SyncRequest } from "@/lib/types/sync";

const SESSION_CREDS_KEY = "academic-planner-sync-creds";
const PERSISTENT_CREDS_KEY = "academic-planner-sync-creds-persist";

export function saveSyncCredentials(
  credentials: SyncRequest,
  persist: boolean
): void {
  if (typeof window === "undefined") return;

  sessionStorage.setItem(SESSION_CREDS_KEY, JSON.stringify(credentials));

  if (persist) {
    localStorage.setItem(PERSISTENT_CREDS_KEY, JSON.stringify(credentials));
  } else {
    localStorage.removeItem(PERSISTENT_CREDS_KEY);
  }
}

export function getSyncCredentials(): SyncRequest | null {
  if (typeof window === "undefined") return null;

  const read = (raw: string | null): SyncRequest | null => {
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as SyncRequest;
      if (!parsed.username || !parsed.password) return null;
      return parsed;
    } catch {
      return null;
    }
  };

  return (
    read(sessionStorage.getItem(SESSION_CREDS_KEY)) ??
    read(localStorage.getItem(PERSISTENT_CREDS_KEY))
  );
}

export function clearSyncCredentials(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(SESSION_CREDS_KEY);
  localStorage.removeItem(PERSISTENT_CREDS_KEY);
}
