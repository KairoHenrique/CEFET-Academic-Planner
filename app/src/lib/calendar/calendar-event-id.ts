import { validationError } from "@/lib/api/errors";

export type CalendarEventSource = "tarefa" | "evento" | "academico";

export interface ParsedCalendarEventId {
  source: CalendarEventSource;
  numericId: number;
}

const ID_PATTERN = /^(tarefa|evento|academico)-(\d+)(?:-.+)?$/;

export function encodeCalendarEventId(
  source: CalendarEventSource,
  numericId: number
): string {
  return `${source}-${numericId}`;
}

export function parseCalendarEventId(rawId: string): ParsedCalendarEventId {
  const match = ID_PATTERN.exec(rawId.trim());
  if (!match) {
    throw validationError("ID do evento inválido.");
  }

  const source = match[1] as CalendarEventSource;
  const numericId = Number.parseInt(match[2], 10);

  if (!Number.isInteger(numericId) || numericId <= 0) {
    throw validationError("ID do evento inválido.");
  }

  return { source, numericId };
}
