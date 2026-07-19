import { useEffect } from "react";
import { DeviceEventEmitter } from "react-native";
import { SYNC_COMPLETE_EVENT } from "./manual-lite-sync";

/** Espelho dos hooks web que escutam `planner:sync-complete`. */
export function useOnSyncComplete(onComplete: () => void): void {
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener(SYNC_COMPLETE_EVENT, onComplete);
    return () => sub.remove();
  }, [onComplete]);
}
