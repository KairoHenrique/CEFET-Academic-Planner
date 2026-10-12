import { useCallback, useEffect } from "react";
import { AppState, type AppStateStatus } from "react-native";
import { useOnSyncComplete } from "../sync/useOnSyncComplete";
import { registerDeviceCalendarBackgroundTask } from "./device-calendar-background-task";
import { readDeviceCalendarState } from "./device-calendar-store";
import { syncDeviceCalendar } from "./sync-device-calendar";

const BOOT_DELAY_MS = 8000;

function runQuietly(force: boolean): void {
  void syncDeviceCalendar({ force }).catch(() => undefined);
}

async function ensureBackgroundTaskIfEnabled(): Promise<void> {
  const state = await readDeviceCalendarState();
  if (state.enabled) await registerDeviceCalendarBackgroundTask();
}

/**
 * Atualiza a agenda do celular após sync do SIGAA e ao voltar ao app (no máx. a cada 6 h).
 * Com o app fechado, a tarefa em segundo plano cuida disso.
 */
export function useDeviceCalendarAutoSync(): void {
  const onSyncComplete = useCallback(() => runQuietly(true), []);
  useOnSyncComplete(onSyncComplete);

  useEffect(() => {
    const bootTimer = setTimeout(() => {
      void ensureBackgroundTaskIfEnabled().catch(() => undefined);
      runQuietly(false);
    }, BOOT_DELAY_MS);
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
