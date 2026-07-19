import { useEffect, useState } from "react";
import {
  getSyncState,
  resetSyncError,
  startManualLiteSync,
  subscribeSyncState,
  type MobileSyncState,
} from "./manual-lite-sync";

/** Hook de sync — espelho mínimo de `useSync` + SyncButton (site). */
export function useMobileSync() {
  const [state, setState] = useState<MobileSyncState>(() => getSyncState());

  useEffect(() => subscribeSyncState(setState), []);

  return {
    ...state,
    startSync: startManualLiteSync,
    resetError: resetSyncError,
  };
}
