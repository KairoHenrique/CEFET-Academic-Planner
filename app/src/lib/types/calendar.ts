export interface CalendarEvent {
  id: string;
  date: string;
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
