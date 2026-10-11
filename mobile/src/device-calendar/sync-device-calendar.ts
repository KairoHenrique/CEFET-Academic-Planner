import * as Calendar from "expo-calendar";
import { Platform } from "react-native";
import { fetchCalendarSyncItems } from "./calendar-sync-api";
import {
  readDeviceCalendarState,
  writeDeviceCalendarState,
  type DeviceCalendarState,
} from "./device-calendar-store";
import {
  applyCalendarDiff,
  deleteAcmeCalendar,
  findOrCreateAcmeCalendar,
} from "./device-calendar-writer";

/** Igual à janela passada do servidor (build-calendar-sync-items). */
const PAST_WINDOW_DAYS = 30;
const AUTO_SYNC_MIN_INTERVAL_MS = 6 * 60 * 60 * 1000;

export type DeviceCalendarSyncResult =
  | { status: "synced"; created: number; removed: number; total: number }
  | { status: "disabled" | "permission_denied" | "unsupported" | "skipped" };

let inFlight: Promise<DeviceCalendarSyncResult> | null = null;

function windowStartDate(): string {
  const date = new Date(Date.now() - PAST_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  return date.toISOString().slice(0, 10);
}

export function isDeviceCalendarSupported(): boolean {
  return Platform.OS === "android";
}

async function hasCalendarPermission(prompt: boolean): Promise<boolean> {
  const current = await Calendar.getCalendarPermissionsAsync();
  if (current.granted) return true;
  if (!prompt || !current.canAskAgain) return false;
  return (await Calendar.requestCalendarPermissionsAsync()).granted;
}

async function runSync(state: DeviceCalendarState): Promise<DeviceCalendarSyncResult> {
  const { items } = await fetchCalendarSyncItems();
  const { calendarId, recreated } = await findOrCreateAcmeCalendar(state.calendarId);
  const result = await applyCalendarDiff({
    calendarId,
    items,
    previous: recreated ? {} : state.entries,
    windowStartDate: windowStartDate(),
  });
  await writeDeviceCalendarState({
    enabled: true,
    calendarId,
    lastSyncedAt: Date.now(),
    entries: result.entries,
  });
  return {
    status: "synced",
    created: result.created,
    removed: result.removed,
    total: Object.keys(result.entries).length,
  };
}

/**
 * `force`: ignora o intervalo mínimo (botão "Sincronizar agora" / após sync do SIGAA).
 * `prompt`: pode abrir o diálogo de permissão (só em ação explícita do usuário).
 */
export function syncDeviceCalendar(options: {
  force?: boolean;
  prompt?: boolean;
} = {}): Promise<DeviceCalendarSyncResult> {
  if (inFlight) return inFlight;
  inFlight = (async (): Promise<DeviceCalendarSyncResult> => {
    if (!isDeviceCalendarSupported()) return { status: "unsupported" };
    const state = await readDeviceCalendarState();
    if (!state.enabled) return { status: "disabled" };
    if (
      !options.force &&
      state.lastSyncedAt &&
      Date.now() - state.lastSyncedAt < AUTO_SYNC_MIN_INTERVAL_MS
    ) {
      return { status: "skipped" };
    }
    if (!(await hasCalendarPermission(options.prompt === true))) {
      return { status: "permission_denied" };
    }
    return runSync(state);
  })().finally(() => {
    inFlight = null;
  });
  return inFlight;
}

export async function enableDeviceCalendarSync(): Promise<DeviceCalendarSyncResult> {
  if (!isDeviceCalendarSupported()) return { status: "unsupported" };
  if (!(await hasCalendarPermission(true))) return { status: "permission_denied" };
  const state = await readDeviceCalendarState();
  await writeDeviceCalendarState({ ...state, enabled: true, lastSyncedAt: null });
  return syncDeviceCalendar({ force: true });
}

/** Desligar remove o calendário "ACME HUB" inteiro do aparelho. */
export async function disableDeviceCalendarSync(): Promise<void> {
  if (inFlight) await inFlight.catch(() => undefined);
  const state = await readDeviceCalendarState();
  if (state.calendarId && (await hasCalendarPermission(false))) {
    await deleteAcmeCalendar(state.calendarId);
  }
  await writeDeviceCalendarState({ enabled: false, calendarId: null, lastSyncedAt: null, entries: {} });
}
