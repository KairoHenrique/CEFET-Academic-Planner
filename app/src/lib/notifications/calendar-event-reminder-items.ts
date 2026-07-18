import { getTaskDueDateTime, normalizeTime } from "@/lib/tasks/dates";
import {
  buildCalendarEventReminderFingerprint,
  buildClassReminderFingerprint,
  type CalendarReminderSlot,
} from "@/lib/notifications/notification-fingerprint";
import type {
  NotificationSnapshotItem,
  PendingCalendarReminderSource,
} from "@/lib/types/notifications-api";

export type { CalendarReminderSlot };
export type ClassReminderSlot = "30m";

const THIRTY_MINUTES_MS = 30 * 60 * 1000;
const MS_PER_DAY = 86_400_000;

function toIsoDate(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function daysBetweenIso(fromIso: string, toIso: string): number {
  const from = new Date(`${fromIso}T12:00:00`).getTime();
  const to = new Date(`${toIso}T12:00:00`).getTime();
  return Math.round((to - from) / MS_PER_DAY);
}

/**
 * Eventos manuais: só cadastro (`new`), 1 dia antes (`1d`) e no dia (`0d`).
 * Não dispara a cada dia da janela anterior de 24h contínuas.
 */
export function getActiveCalendarReminderSlots(
  event: Pick<PendingCalendarReminderSource, "startDateIso" | "startTime">,
  now: Date
): CalendarReminderSlot[] {
  const startDateIso = event.startDateIso.trim();
  if (!startDateIso) return [];

  const todayIso = toIsoDate(now);
  const days = daysBetweenIso(todayIso, startDateIso);
  if (days < 0) return [];

  const slots: CalendarReminderSlot[] = ["new"];
  if (days === 1) slots.push("1d");
  if (days === 0) slots.push("0d");
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
  if (slot === "new") return "Novo evento";
  if (slot === "1d") return "Evento amanhã";
  return "Evento hoje";
}

function buildClassReminderTitle(): string {
  return "Aula em 30 minutos";
}

function buildCalendarReminderSubtitle(
  event: PendingCalendarReminderSource,
  slot: CalendarReminderSlot
): string {
  const prefix =
    slot === "new"
      ? "Cadastrado"
      : slot === "1d"
        ? "Amanhã"
        : "Hoje";
  return `${prefix}: ${event.title} · ${event.subtitle}`;
}

function buildClassReminderSubtitle(event: PendingCalendarReminderSource): string {
  return `Sua aula começa em 30 min: ${event.title} · ${event.subtitle}`;
}

/** Eventos manuais e marcos — cadastro, 1 dia antes e no dia. */
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
