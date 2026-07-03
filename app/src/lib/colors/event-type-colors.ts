import type { CalendarEventType } from "@/lib/calendar/event-types";

/** Cores fixas por tipo — distintas e alinhadas à paleta Cruzeiro. */
export const EVENT_TYPE_COLORS: Record<CalendarEventType, string> = {
  aula: "#1A8FE3",
  tarefa: "#D4A843",
  prova: "#F85149",
  evento: "#A371F7",
  monitoria: "#39D0D8",
  estagio: "#3FB950",
  estudo: "#58A6FF",
  outro: "#94A3B4",
};

export function resolveDefaultEventColor(
  type: CalendarEventType,
  subjectColor?: string | null
): string {
  if (type === "aula" && subjectColor) return subjectColor;
  return EVENT_TYPE_COLORS[type];
}
