import { buildCalendar } from "@/lib/calendar/build-calendar";
import { normalizeTime } from "@/lib/tasks/dates";
import type { PendingCalendarReminderSource } from "@/lib/types/notifications-api";
import type { CalendarEvent } from "@/lib/types/calendar";

const DEFAULT_ALL_DAY_TIME = "09:00";

function resolveEventStartTime(event: CalendarEvent): string {
  if (event.timeStart?.trim()) {
    return normalizeTime(event.timeStart);
  }

  const fromTitle = event.title.match(/·\s*(\d{1,2}:\d{2})\s*$/);
  if (fromTitle?.[1]) {
    return normalizeTime(fromTitle[1]);
  }

  return DEFAULT_ALL_DAY_TIME;
}

function isNotifiableCalendarEvent(event: CalendarEvent): boolean {
  if (event.id.startsWith("academico-")) return false;
  if (event.done) return false;
  return true;
}

function toReminderSource(event: CalendarEvent): PendingCalendarReminderSource {
  return {
    eventId: event.id,
    title: event.title,
    subtitle: event.subject ?? "Calendário",
    href: event.type === "aula" && event.subjectCode
      ? `/disciplinas/${encodeURIComponent(event.subjectCode)}`
      : "/calendario",
    startDateIso: event.date,
    startTime: resolveEventStartTime(event),
  };
}

/** Núcleo puro — separa aulas da grade dos demais eventos, agnóstico de backend. */
export function buildPendingCalendarReminderSourcesFromEvents(
  events: CalendarEvent[],
  referenceDate = new Date()
): {
  events: PendingCalendarReminderSource[];
  classes: PendingCalendarReminderSource[];
} {
  const refIso = [
    referenceDate.getFullYear(),
    String(referenceDate.getMonth() + 1).padStart(2, "0"),
    String(referenceDate.getDate()).padStart(2, "0"),
  ].join("-");

  const upcoming = events
    .filter(isNotifiableCalendarEvent)
    .filter((event) => (event.dateEnd ?? event.date) >= refIso);

  const classes: PendingCalendarReminderSource[] = [];
  const manualEvents: PendingCalendarReminderSource[] = [];

  for (const event of upcoming) {
    const source = toReminderSource(event);
    if (event.type === "aula" || event.id.startsWith("aula-")) {
      classes.push(source);
      continue;
    }
    manualEvents.push(source);
  }

  return { events: manualEvents, classes };
}

/** Server-only (SQLite): separa aulas da grade dos demais eventos do calendário. */
export function buildPendingCalendarReminderSources(referenceDate = new Date()): {
  events: PendingCalendarReminderSource[];
  classes: PendingCalendarReminderSource[];
} {
  const { events } = buildCalendar();
  return buildPendingCalendarReminderSourcesFromEvents(events, referenceDate);
}
