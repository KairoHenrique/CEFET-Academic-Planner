import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "acme.deviceCalendar.v1";

export interface DeviceCalendarEntry {
  eventId: string;
  fingerprint: string;
  /** YYYY-MM-DD do início — decide se o item saiu da janela (mantém) ou foi removido (apaga). */
  startDate: string;
}

export interface DeviceCalendarState {
  enabled: boolean;
  calendarId: string | null;
  lastSyncedAt: number | null;
  entries: Record<string, DeviceCalendarEntry>;
}

const EMPTY_STATE: DeviceCalendarState = {
  enabled: false,
  calendarId: null,
  lastSyncedAt: null,
  entries: {},
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function parseEntries(raw: unknown): Record<string, DeviceCalendarEntry> {
  if (!isRecord(raw)) return {};
  const entries: Record<string, DeviceCalendarEntry> = {};
  for (const [uid, value] of Object.entries(raw)) {
    if (
      isRecord(value) &&
      typeof value.eventId === "string" &&
      typeof value.fingerprint === "string" &&
      typeof value.startDate === "string"
    ) {
      entries[uid] = {
        eventId: value.eventId,
        fingerprint: value.fingerprint,
        startDate: value.startDate,
      };
    }
  }
  return entries;
}

export async function readDeviceCalendarState(): Promise<DeviceCalendarState> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...EMPTY_STATE, entries: {} };
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return { ...EMPTY_STATE, entries: {} };
    return {
      enabled: parsed.enabled === true,
      calendarId: typeof parsed.calendarId === "string" ? parsed.calendarId : null,
      lastSyncedAt: typeof parsed.lastSyncedAt === "number" ? parsed.lastSyncedAt : null,
      entries: parseEntries(parsed.entries),
    };
  } catch {
    return { ...EMPTY_STATE, entries: {} };
  }
}

export async function writeDeviceCalendarState(state: DeviceCalendarState): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
