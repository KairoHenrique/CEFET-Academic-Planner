const BACKGROUND_SYNC_FLAG = "planner:background-sync-on-entry";

export function markBackgroundSyncPending(): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(BACKGROUND_SYNC_FLAG, "1");
}

export function consumeBackgroundSyncPending(): boolean {
  if (typeof window === "undefined") return false;

  const pending = sessionStorage.getItem(BACKGROUND_SYNC_FLAG) === "1";
  if (pending) {
    sessionStorage.removeItem(BACKGROUND_SYNC_FLAG);
  }
  return pending;
}
