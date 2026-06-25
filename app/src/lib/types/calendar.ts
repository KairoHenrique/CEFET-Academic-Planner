export interface CalendarEvent {
  id: string;
  date: string;
  title: string;
  type: "aula" | "tarefa" | "prova" | "evento";
  subject?: string;
  subjectCode?: string;
  color: string;
  description: string;
  done?: boolean;
  manual?: boolean;
}

export const eventTypeLabels = {
  aula: "Aula",
  tarefa: "Tarefa",
  prova: "Prova",
  evento: "Evento",
} as const;

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
