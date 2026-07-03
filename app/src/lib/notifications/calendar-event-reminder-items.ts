import { getTaskDueDateTime, normalizeTime } from "@/lib/tasks/dates";
import {
  buildCalendarEventReminderFingerprint,
  buildClassReminderFingerprint,
} from "@/lib/notifications/notification-fingerprint";
import type {
  NotificationSnapshotItem,
  PendingCalendarReminderSource,
} from "@/lib/types/notifications-api";

export type CalendarReminderSlot = "24h" | "1h";
export type ClassReminderSlot = "30m";

const ONE_HOUR_MS = 60 * 60 * 1000;
const TWENTY_FOUR_HOURS_MS = 24 * ONE_HOUR_MS;
const THIRTY_MINUTES_MS = 30 * 60 * 1000;

export function getActiveCalendarReminderSlots(
  event: Pick<PendingCalendarReminderSource, "startDateIso" | "startTime">,
  now: Date
): CalendarReminderSlot[] {
  if (!event.startDateIso.trim()) return [];

  const start = getTaskDueDateTime(
    event.startDateIso,
    normalizeTime(event.startTime)
  );
  if (start.getTime() <= now.getTime()) return [];

  const msUntilStart = start.getTime() - now.getTime();
  const slots: CalendarReminderSlot[] = [];

  if (msUntilStart <= TWENTY_FOUR_HOURS_MS) slots.push("24h");
  if (msUntilStart <= ONE_HOUR_MS) slots.push("1h");

  return slots;
}

export function getActiveClassReminderSlots(
  event: Pick<PendingCalendarReminderSource, "startDateIso" | "startTime">,
  now: Date
): ClassReminderSlot[] {
  if (!event.startDateIso.trim()) return [];

  const start = getTaskDueDateTime(
    event.startDateIso,
    normalizeTime(event.startTime)
  );
  if (start.getTime() <= now.getTime()) return [];

  const msUntilStart = start.getTime() - now.getTime();
  return msUntilStart <= THIRTY_MINUTES_MS ? ["30m"] : [];
}

function buildCalendarReminderTitle(slot: CalendarReminderSlot): string {
  return slot === "24h" ? "Evento em 24 horas" : "Evento em 1 hora";
}

function buildClassReminderTitle(): string {
  return "Aula em 30 minutos";
}

function buildCalendarReminderSubtitle(
  event: PendingCalendarReminderSource,
  slot: CalendarReminderSlot
): string {
  const prefix = slot === "24h" ? "Faltam 24h para" : "Faltam 1h para";
  return `${prefix}: ${event.title} · ${event.subtitle}`;
}

function buildClassReminderSubtitle(event: PendingCalendarReminderSource): string {
  return `Sua aula começa em 30 min: ${event.title} · ${event.subtitle}`;
}

/** Eventos manuais e marcos — 24h e 1h antes. */
export function buildCalendarEventReminderItems(
  events: PendingCalendarReminderSource[],
  now = new Date()
): NotificationSnapshotItem[] {
  const items: NotificationSnapshotItem[] = [];

  for (const event of events) {
    for (const slot of getActiveCalendarReminderSlots(event, now)) {
      items.push({
        fingerprint: buildCalendarEventReminderFingerprint(
          event.eventId,
          event.startDateIso,
          slot
        ),
        kind: "calendar-event-reminder",
        title: buildCalendarReminderTitle(slot),
        subtitle: buildCalendarReminderSubtitle(event, slot),
        href: event.href,
        at: event.startDateIso,
      });
    }
  }

  return items;
}

/** Aulas da grade — somente 30 min antes. */
export function buildClassSessionReminderItems(
  sessions: PendingCalendarReminderSource[],
  now = new Date()
): NotificationSnapshotItem[] {
  const items: NotificationSnapshotItem[] = [];

  for (const session of sessions) {
    for (const _slot of getActiveClassReminderSlots(session, now)) {
      items.push({
        fingerprint: buildClassReminderFingerprint(
          session.eventId,
          session.startDateIso
        ),
        kind: "class-reminder",
        title: buildClassReminderTitle(),
        subtitle: buildClassReminderSubtitle(session),
        href: session.href,
        at: session.startDateIso,
      });
    }
  }

  return items;
}
