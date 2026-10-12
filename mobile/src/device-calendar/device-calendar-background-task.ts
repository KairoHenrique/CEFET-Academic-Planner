import * as BackgroundTask from "expo-background-task";
import * as TaskManager from "expo-task-manager";

export const DEVICE_CALENDAR_TASK = "acme-device-calendar-sync";
/** Minutos. O Android decide o horário real (economia de bateria pode atrasar). */
const MINIMUM_INTERVAL_MINUTES = 180;

/**
 * Precisa ser definido no escopo do módulo, importado em `index.ts` antes do app:
 * com o app fechado o Android sobe só o JS, sem montar telas.
 */
TaskManager.defineTask(DEVICE_CALENDAR_TASK, async () => {
  try {
    const { hydrateSession, getSession } = await import("../auth/session");
    if (!getSession()) await hydrateSession();
    if (!getSession()) return BackgroundTask.BackgroundTaskResult.Success;

    const { syncDeviceCalendar } = await import("./sync-device-calendar");
    await syncDeviceCalendar({ force: true });
    return BackgroundTask.BackgroundTaskResult.Success;
  } catch {
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});

export async function registerDeviceCalendarBackgroundTask(): Promise<void> {
  const status = await BackgroundTask.getStatusAsync();
  if (status !== BackgroundTask.BackgroundTaskStatus.Available) return;
  if (await TaskManager.isTaskRegisteredAsync(DEVICE_CALENDAR_TASK)) return;
  await BackgroundTask.registerTaskAsync(DEVICE_CALENDAR_TASK, {
    minimumInterval: MINIMUM_INTERVAL_MINUTES,
  });
}

export async function unregisterDeviceCalendarBackgroundTask(): Promise<void> {
  if (await TaskManager.isTaskRegisteredAsync(DEVICE_CALENDAR_TASK)) {
    await BackgroundTask.unregisterTaskAsync(DEVICE_CALENDAR_TASK);
  }
}
