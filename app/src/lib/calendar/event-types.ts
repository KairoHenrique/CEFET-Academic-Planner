import type { CalendarEvent, EventTypeFilter } from "@/lib/types/calendar";

export const CALENDAR_EVENT_TYPES = [
  "aula",
  "tarefa",
  "prova",
  "evento",
  "monitoria",
  "estagio",
  "estudo",
  "outro",
] as const satisfies readonly CalendarEvent["type"][];

export type CalendarEventType = (typeof CALENDAR_EVENT_TYPES)[number];

export const eventTypeLabels: Record<CalendarEventType, string> = {
  aula: "Aula",
  tarefa: "Tarefa",
  prova: "Prova",
  evento: "Evento",
  monitoria: "Monitoria",
  estagio: "Estágio",
  estudo: "Estudo",
  outro: "Outro",
};

export const CALENDAR_FILTER_OPTIONS = [
  "Todas",
  "Tarefa",
  "Prova",
  "Aula",
  "Monitoria",
  "Estágio",
  "Estudo",
  "Evento",
  "Outro",
] as const;

export const filterLabelToType: Record<string, EventTypeFilter> = {
  Todas: "todas",
  Tarefa: "tarefa",
  Prova: "prova",
  Aula: "aula",
  Monitoria: "monitoria",
  Estágio: "estagio",
  Estudo: "estudo",
  Evento: "evento",
  Outro: "outro",
};

export const UNLINKED_SUBJECT_VALUE = "__none__";

export function isAcademicTaskType(type: CalendarEventType): boolean {
  return type === "tarefa" || type === "prova";
}

export function canToggleCalendarEvent(id: string): boolean {
  return !id.startsWith("academico-") && !id.startsWith("aula-");
}

/** Eventos criados pelo aluno (manuais) — excluir no detalhe. */
export function canDeleteCalendarEvent(event: {
  id: string;
  manual?: boolean;
}): boolean {
  if (event.id.startsWith("academico-") || event.id.startsWith("aula-")) {
    return false;
  }
  if (event.id.startsWith("evento-")) return true;
  if (event.id.startsWith("tarefa-")) return event.manual === true;
  return event.manual === true;
}
