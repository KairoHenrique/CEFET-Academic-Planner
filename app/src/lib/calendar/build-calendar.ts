import {
  getCalendarioAcademico,
  getEventosCalendario,
  getTarefasForCalendar,
} from "@/lib/db/queries";
import {
  formatAcademicDateLabel,
  mapCalendarRowsToEvents,
} from "./map-calendar-event";
import type { CalendarResponse } from "@/lib/types/calendar-api";

export function buildCalendar(): CalendarResponse {
  const academicRows = getCalendarioAcademico();

  return {
    events: mapCalendarRowsToEvents({
      tarefas: getTarefasForCalendar(),
      eventosManuais: getEventosCalendario(),
      academicos: academicRows,
    }),
    academicDates: academicRows.map((row) => ({
      label: row.evento,
      date: formatAcademicDateLabel(row),
    })),
  };
}
