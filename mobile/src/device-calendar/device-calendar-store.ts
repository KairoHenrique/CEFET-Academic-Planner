import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "acme.deviceCalendar.v2";
/** v1 tinha uma agenda só; ao migrar, as agendas antigas são recriadas por matéria. */
const LEGACY_STORAGE_KEY = "acme.deviceCalendar.v1";

export interface DeviceCalendarEntry {
  eventId: string;
  calendarId: string;
  fingerprint: string;
  /** YYYY-MM-DD do início — decide se o item saiu da janela (mantém) ou foi removido (apaga). */
  startDate: string;
}

export interface DeviceCalendarRef {
  id: string;
  title: string;
  color: string;
}

export interface DeviceCalendarState {
  enabled: boolean;
  /** Chave do grupo ("geral" ou "m:<código da matéria>") → agenda no aparelho. */
  calendars: Record<string, DeviceCalendarRef>;
  lastSyncedAt: number | null;
  entries: Record<string, DeviceCalendarEntry>;
}

function emptyState(enabled = false): DeviceCalendarState {
  return { enabled, calendars: {}, lastSyncedAt: null, entries: {} };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function parseEntries(raw: unknown): Record<string, DeviceCalendarEntry> {
  if (!isRecord(raw)) return {};
  const entries: Record<string, DeviceCalendarEntry> = {};
  for (const [uid, value] of Object.entries(raw)) {
    if (
      isRecord(value) &&
      isString(value.eventId) &&
      isString(value.calendarId) &&
      isString(value.fingerprint) &&
      isString(value.startDate)
    ) {
      entries[uid] = {
        eventId: value.eventId,
        calendarId: value.calendarId,
        fingerprint: value.fingerprint,
        startDate: value.startDate,
      };
    }
  }
  return entries;
}

function parseCalendars(raw: unknown): Record<string, DeviceCalendarRef> {
  if (!isRecord(raw)) return {};
  const calendars: Record<string, DeviceCalendarRef> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (isRecord(value) && isString(value.id) && isString(value.title) && isString(value.color)) {
      calendars[key] = { id: value.id, title: value.title, color: value.color };
    }
  }
  return calendars;
}

async function readLegacyEnabled(): Promise<boolean> {
  const raw = await AsyncStorage.getItem(LEGACY_STORAGE_KEY);
  if (!raw) return false;
  await AsyncStorage.removeItem(LEGACY_STORAGE_KEY);
  const parsed: unknown = JSON.parse(raw);
  return isRecord(parsed) && parsed.enabled === true;
}

export async function readDeviceCalendarState(): Promise<DeviceCalendarState> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState(await readLegacyEnabled());
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return emptyState();
    return {
      enabled: parsed.enabled === true,
      calendars: parseCalendars(parsed.calendars),
      lastSyncedAt: typeof parsed.lastSyncedAt === "number" ? parsed.lastSyncedAt : null,
      entries: parseEntries(parsed.entries),
    };
  } catch {
    return emptyState();
  }
}

export async function writeDeviceCalendarState(state: DeviceCalendarState): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function disabledDeviceCalendarState(): DeviceCalendarState {
  return emptyState(false);
}
