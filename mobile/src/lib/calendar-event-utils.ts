import type { CalendarEvent } from "@acme/api-contracts";

export function canToggleCalendarEvent(id: string): boolean {
  return !id.startsWith("academico-") && !id.startsWith("aula-");
}

export function canDeleteCalendarEvent(event: CalendarEvent): boolean {
  if (event.id.startsWith("academico-") || event.id.startsWith("aula-")) {
    return false;
  }
  if (event.id.startsWith("evento-")) return true;
  if (event.id.startsWith("tarefa-")) return event.manual === true;
  return event.manual === true;
}

export function formatCalendarEventDateLabel(
  event: Pick<
    CalendarEvent,
    "id" | "date" | "dateEnd" | "timeStart" | "timeEnd"
  >
): string {
  const date = new Date(`${event.date}T12:00:00`);
  let datePart = date.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  if (event.dateEnd && event.dateEnd !== event.date) {
    const end = new Date(`${event.dateEnd}T12:00:00`);
    datePart = `${date.toLocaleDateString("pt-BR")} – ${end.toLocaleDateString("pt-BR")}`;
  } else if (
    event.id.startsWith("academico-") ||
    event.id.startsWith("evento-") ||
    event.id.startsWith("tarefa-")
  ) {
    datePart = date.toLocaleDateString("pt-BR");
  }

  const timeStart = event.timeStart?.trim();
  const timeEnd = event.timeEnd?.trim();
  let timePart: string | null = null;
  if (timeStart && timeEnd && timeStart !== timeEnd) {
    timePart = `${timeStart} – ${timeEnd}`;
  } else if (timeStart) {
    timePart = timeStart;
  } else if (timeEnd) {
    timePart = `até ${timeEnd}`;
  }

  return timePart ? `${datePart} · ${timePart}` : datePart;
}

export function parseTaskIdFromCalendarEvent(event: CalendarEvent): number | null {
  const match = event.id.match(/^tarefa-(\d+)$/);
  if (!match) return null;
  const id = Number(match[1]);
  return Number.isFinite(id) ? id : null;
}
