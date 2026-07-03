import { formatAcademicDateRange, formatIsoToBrDate } from "@/lib/calendar/academic-date-format";

export interface CalendarEvent {
  id: string;
  date: string;
  /** Fim do intervalo (inclusive) — ex.: matrícula, período letivo. */
  dateEnd?: string;
  /** HH:mm */
  timeStart?: string;
  /** HH:mm */
  timeEnd?: string;
  title: string;
  type:
    | "aula"
    | "tarefa"
    | "prova"
    | "evento"
    | "monitoria"
    | "estagio"
    | "estudo"
    | "outro";
  subject?: string;
  subjectCode?: string;
  color: string;
  description: string;
  done?: boolean;
  manual?: boolean;
}

export type { CalendarEventType } from "@/lib/calendar/event-types";
export {
  CALENDAR_EVENT_TYPES,
  eventTypeLabels,
  CALENDAR_FILTER_OPTIONS,
  filterLabelToType,
  UNLINKED_SUBJECT_VALUE,
  isAcademicTaskType,
} from "@/lib/calendar/event-types";

export type EventTypeFilter = "todas" | CalendarEvent["type"];

export function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function formatEventDate(dateStr: string): string {
  return parseLocalDate(dateStr).toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatEventTimeRange(timeStart?: string, timeEnd?: string): string | null {
  if (timeStart && timeEnd && timeStart !== timeEnd) {
    return `${timeStart} – ${timeEnd}`;
  }
  if (timeStart) return timeStart;
  if (timeEnd) return `até ${timeEnd}`;
  return null;
}

export function eventOccursOnIsoDate(
  event: Pick<CalendarEvent, "date" | "dateEnd">,
  isoDate: string
): boolean {
  const end = event.dateEnd ?? event.date;
  return isoDate >= event.date && isoDate <= end;
}

export function formatCalendarEventDateLabel(
  event: Pick<
    CalendarEvent,
    "id" | "date" | "dateEnd" | "timeStart" | "timeEnd"
  >
): string {
  let datePart: string;
  if (event.dateEnd && event.dateEnd !== event.date) {
    datePart = formatAcademicDateRange(event.date, event.dateEnd);
  } else if (event.id.startsWith("academico-")) {
    datePart = formatIsoToBrDate(event.date);
  } else if (event.id.startsWith("evento-") || event.id.startsWith("tarefa-")) {
    datePart = formatIsoToBrDate(event.date);
  } else {
    datePart = formatEventDate(event.date);
  }

  const timePart = formatEventTimeRange(event.timeStart, event.timeEnd);
  return timePart ? `${datePart} · ${timePart}` : datePart;
}

export function isUpcomingCalendarEvent(
  event: Pick<CalendarEvent, "date" | "dateEnd">,
  referenceDate = new Date()
): boolean {
  const refIso = [
    referenceDate.getFullYear(),
    String(referenceDate.getMonth() + 1).padStart(2, "0"),
    String(referenceDate.getDate()).padStart(2, "0"),
  ].join("-");

  const end = event.dateEnd ?? event.date;
  return end >= refIso;
}
