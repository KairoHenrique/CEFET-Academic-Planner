import * as Calendar from "expo-calendar";
import type { CalendarSyncItem } from "@acme/api-contracts";
import type { DeviceCalendarEntry, DeviceCalendarRef } from "./device-calendar-store";

const BASE_TITLE = "ACME HUB";
const GENERAL_GROUP_KEY = "geral";
const GENERAL_COLOR = "#E9B949";
const TIMEZONE = "America/Sao_Paulo";
const WRITE_CONCURRENCY = 6;
const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/;

export interface CalendarGroup {
  key: string;
  title: string;
  color: string;
}

/** Uma agenda por matéria (cor da disciplina); sem matéria → agenda geral dourada. */
export function resolveCalendarGroup(item: CalendarSyncItem): CalendarGroup {
  const subject = item.subject;
  if (!subject || !HEX_COLOR.test(subject.color)) {
    return { key: GENERAL_GROUP_KEY, title: BASE_TITLE, color: GENERAL_COLOR };
  }
  return {
    key: `m:${subject.key}`,
    title: `${BASE_TITLE} · ${subject.label}`.slice(0, 80),
    color: subject.color.toUpperCase(),
  };
}

function isAcmeCalendar(calendar: Calendar.Calendar): boolean {
  return calendar.allowsModifications && calendar.title.startsWith(BASE_TITLE);
}

export async function deleteDeviceCalendars(calendarIds: string[]): Promise<void> {
  for (const calendarId of calendarIds) {
    await Calendar.deleteCalendarAsync(calendarId).catch(() => undefined);
  }
}

async function createDeviceCalendar(group: CalendarGroup): Promise<DeviceCalendarRef> {
  const id = await Calendar.createCalendarAsync({
    title: group.title,
    name: `acme-hub-${group.key}`,
    color: group.color,
    entityType: Calendar.EntityTypes.EVENT,
    source: { isLocalAccount: true, name: BASE_TITLE, type: Calendar.SourceType.LOCAL },
    ownerAccount: BASE_TITLE,
    accessLevel: Calendar.CalendarAccessLevel.OWNER,
    timeZone: TIMEZONE,
    isVisible: true,
    isSynced: true,
  });
  return { id, title: group.title, color: group.color };
}

export interface EnsureCalendarsResult {
  calendars: Record<string, DeviceCalendarRef>;
  /** Agendas que ainda existem no aparelho (o aluno pode ter apagado alguma). */
  liveCalendarIds: Set<string>;
}

/**
 * Garante uma agenda por grupo necessário. Agendas de matérias antigas são mantidas
 * (guardam o histórico). Sem estado local (reinstalação/migração), apaga agendas
 * "ACME HUB" órfãs para não duplicar eventos que não sabemos rastrear.
 */
export async function ensureDeviceCalendars(
  groups: CalendarGroup[],
  known: Record<string, DeviceCalendarRef>
): Promise<EnsureCalendarsResult> {
  const deviceCalendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  const deviceIds = new Set(deviceCalendars.map((calendar) => calendar.id));
  const calendars: Record<string, DeviceCalendarRef> = {};

  for (const [key, ref] of Object.entries(known)) {
    if (deviceIds.has(ref.id)) calendars[key] = ref;
  }
  if (Object.keys(calendars).length === 0) {
    await deleteDeviceCalendars(deviceCalendars.filter(isAcmeCalendar).map((c) => c.id));
  }

  for (const group of groups) {
    const existing = calendars[group.key];
    if (!existing) {
      calendars[group.key] = await createDeviceCalendar(group);
      continue;
    }
    if (existing.color !== group.color || existing.title !== group.title) {
      await Calendar.updateCalendarAsync(existing.id, { color: group.color, title: group.title })
        .then(() => {
          calendars[group.key] = { ...existing, color: group.color, title: group.title };
        })
        .catch(() => undefined);
    }
  }

  return {
    calendars,
    liveCalendarIds: new Set(Object.values(calendars).map((ref) => ref.id)),
  };
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
 * Aplica só a diferença: cria novos, recria alterados (inclusive troca de matéria/cor),
 * apaga removidos que ainda estão na janela. Itens que só "envelheceram" para fora da
 * janela continuam no celular.
 */
export async function applyCalendarDiff(input: {
  items: CalendarSyncItem[];
  previous: Record<string, DeviceCalendarEntry>;
  calendars: Record<string, DeviceCalendarRef>;
  liveCalendarIds: Set<string>;
  windowStartDate: string;
}): Promise<ApplyDiffResult> {
  const next: Record<string, DeviceCalendarEntry> = {};
  const toCreate: Array<{ item: CalendarSyncItem; calendarId: string; fingerprint: string }> = [];
  const toDelete: string[] = [];
  const incomingUids = new Set<string>();

  for (const item of input.items) {
    const calendarId = input.calendars[resolveCalendarGroup(item).key]?.id;
    if (!calendarId) continue;
    incomingUids.add(item.uid);
    const fingerprint = fingerprintItem(item);
    const known = input.previous[item.uid];
    const knownAlive = known && input.liveCalendarIds.has(known.calendarId);
    if (knownAlive && known.fingerprint === fingerprint && known.calendarId === calendarId) {
      next[item.uid] = known;
      continue;
    }
    if (knownAlive) toDelete.push(known.eventId);
    toCreate.push({ item, calendarId, fingerprint });
  }
  for (const [uid, entry] of Object.entries(input.previous)) {
    if (
      !incomingUids.has(uid) &&
      entry.startDate >= input.windowStartDate &&
      input.liveCalendarIds.has(entry.calendarId)
    ) {
      toDelete.push(entry.eventId);
    }
  }

  await runInBatches(toDelete, (eventId) =>
    Calendar.deleteEventAsync(eventId).catch(() => undefined)
  );
  await runInBatches(toCreate, async ({ item, calendarId, fingerprint }) => {
    try {
      const eventId = await Calendar.createEventAsync(calendarId, toEventDetails(item));
      next[item.uid] = { eventId, calendarId, fingerprint, startDate: item.start.slice(0, 10) };
    } catch {
      // Item fica sem entrada e é recriado na próxima sincronização.
    }
  });

  return { entries: next, created: toCreate.length, removed: toDelete.length };
}
