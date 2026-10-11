import * as Calendar from "expo-calendar";
import type { CalendarSyncItem } from "@acme/api-contracts";
import type { DeviceCalendarEntry } from "./device-calendar-store";

const CALENDAR_TITLE = "ACME HUB";
const CALENDAR_COLOR = "#E9B949";
const TIMEZONE = "America/Sao_Paulo";
const WRITE_CONCURRENCY = 6;

/**
 * Reusa o calendário conhecido. Um "ACME HUB" órfão (estado local perdido, ex.: reinstalação)
 * é recriado para não duplicar eventos que não sabemos rastrear.
 */
export async function findOrCreateAcmeCalendar(
  knownId: string | null
): Promise<{ calendarId: string; recreated: boolean }> {
  const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  const known = knownId ? calendars.find((calendar) => calendar.id === knownId) : undefined;
  if (known) return { calendarId: known.id, recreated: false };

  const orphans = calendars.filter(
    (calendar) => calendar.title === CALENDAR_TITLE && calendar.allowsModifications
  );
  for (const orphan of orphans) await deleteAcmeCalendar(orphan.id);

  const calendarId = await Calendar.createCalendarAsync({
    title: CALENDAR_TITLE,
    name: "acme-hub",
    color: CALENDAR_COLOR,
    entityType: Calendar.EntityTypes.EVENT,
    source: { isLocalAccount: true, name: CALENDAR_TITLE, type: Calendar.SourceType.LOCAL },
    ownerAccount: CALENDAR_TITLE,
    accessLevel: Calendar.CalendarAccessLevel.OWNER,
    timeZone: TIMEZONE,
    isVisible: true,
    isSynced: true,
  });
  return { calendarId, recreated: true };
}

export async function deleteAcmeCalendar(calendarId: string): Promise<void> {
  await Calendar.deleteCalendarAsync(calendarId).catch(() => undefined);
}

/** djb2 — só detecta mudança no item; não é uso criptográfico. */
export function fingerprintItem(item: CalendarSyncItem): string {
  const text = JSON.stringify(item);
  let hash = 5381;
  for (let index = 0; index < text.length; index += 1) {
    hash = ((hash << 5) + hash + text.charCodeAt(index)) | 0;
  }
  return (hash >>> 0).toString(36);
}

/** Android só aceita lembrete antes do início; dia inteiro usa meia-noite UTC. */
function toEventDetails(item: CalendarSyncItem): Omit<Partial<Calendar.Event>, "id" | "organizer"> {
  const alarms = item.alarmOffsetsMinutes
    .filter((offset) => offset <= 0)
    .map((offset) => ({ relativeOffset: offset, method: Calendar.AlarmMethod.ALERT }));
  const base = {
    title: item.title,
    notes: item.notes,
    location: item.location ?? "",
    alarms,
    availability: item.allDay ? Calendar.Availability.FREE : Calendar.Availability.BUSY,
  };
  if (item.allDay) {
    return {
      ...base,
      allDay: true,
      startDate: new Date(`${item.start}T00:00:00Z`),
      endDate: new Date(`${item.end}T00:00:00Z`),
      timeZone: "UTC",
    };
  }
  return {
    ...base,
    allDay: false,
    startDate: new Date(`${item.start}:00-03:00`),
    endDate: new Date(`${item.end}:00-03:00`),
    timeZone: TIMEZONE,
  };
}

async function runInBatches<T>(tasks: T[], worker: (task: T) => Promise<void>): Promise<void> {
  for (let start = 0; start < tasks.length; start += WRITE_CONCURRENCY) {
    await Promise.all(tasks.slice(start, start + WRITE_CONCURRENCY).map(worker));
  }
}

export interface ApplyDiffResult {
  entries: Record<string, DeviceCalendarEntry>;
  created: number;
  removed: number;
}

/**
 * Aplica só a diferença: cria novos, recria alterados, apaga removidos que ainda estão
 * na janela. Itens que só "envelheceram" para fora da janela continuam no celular.
 */
export async function applyCalendarDiff(input: {
  calendarId: string;
  items: CalendarSyncItem[];
  previous: Record<string, DeviceCalendarEntry>;
  windowStartDate: string;
}): Promise<ApplyDiffResult> {
  const next: Record<string, DeviceCalendarEntry> = {};
  const toCreate: CalendarSyncItem[] = [];
  const toDelete: string[] = [];
  const incomingUids = new Set<string>();

  for (const item of input.items) {
    incomingUids.add(item.uid);
    const fingerprint = fingerprintItem(item);
    const known = input.previous[item.uid];
    if (known && known.fingerprint === fingerprint) {
      next[item.uid] = known;
      continue;
    }
    if (known) toDelete.push(known.eventId);
    toCreate.push(item);
  }
  for (const [uid, entry] of Object.entries(input.previous)) {
    if (!incomingUids.has(uid) && entry.startDate >= input.windowStartDate) {
      toDelete.push(entry.eventId);
    }
  }

  await runInBatches(toDelete, (eventId) =>
    Calendar.deleteEventAsync(eventId).catch(() => undefined)
  );
  await runInBatches(toCreate, async (item) => {
    try {
      const eventId = await Calendar.createEventAsync(input.calendarId, toEventDetails(item));
      next[item.uid] = {
        eventId,
        fingerprint: fingerprintItem(item),
        startDate: item.start.slice(0, 10),
      };
    } catch {
      // Item fica sem entrada e é recriado na próxima sincronização.
    }
  });

  return { entries: next, created: toCreate.length, removed: toDelete.length };
}
