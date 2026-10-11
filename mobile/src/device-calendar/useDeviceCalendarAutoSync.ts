import { useCallback, useEffect } from "react";
import { AppState, type AppStateStatus } from "react-native";
import { useOnSyncComplete } from "../sync/useOnSyncComplete";
import { syncDeviceCalendar } from "./sync-device-calendar";

const BOOT_DELAY_MS = 8000;

function runQuietly(force: boolean): void {
  void syncDeviceCalendar({ force }).catch(() => undefined);
}

/** Atualiza a agenda do celular após sync do SIGAA e ao voltar ao app (no máx. a cada 6 h). */
export function useDeviceCalendarAutoSync(): void {
  const onSyncComplete = useCallback(() => runQuietly(true), []);
  useOnSyncComplete(onSyncComplete);

  useEffect(() => {
    const bootTimer = setTimeout(() => runQuietly(false), BOOT_DELAY_MS);
    const onChange = (state: AppStateStatus) => {
      if (state === "active") runQuietly(false);
    };
    const subscription = AppState.addEventListener("change", onChange);
    return () => {
      clearTimeout(bootTimer);
      subscription.remove();
    };
  }, []);
}
