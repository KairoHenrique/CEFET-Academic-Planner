import {
  getCalendarioAcademico,
  getEventosCalendario,
  getSemestreAtual,
  getTarefasForCalendar,
  purgeInvalidCalendarioAcademico,
} from "@/lib/db/queries";
import { buildAcademicDateDisplayGroups } from "@/lib/calendar/group-academic-dates";
import { expandAcademicRowsToCalendarEvents } from "@/lib/calendar/expand-academic-calendar-events";
import { expandClassSessionEvents } from "@/lib/calendar/expand-class-session-events";
import { expandManualCalendarEvents } from "@/lib/calendar/expand-manual-calendar-events";
import {
  mapCalendarRowsToEvents,
} from "./map-calendar-event";
import type { CalendarResponse } from "@/lib/types/calendar-api";
import type { CalendarEvent } from "@/lib/types/calendar";

function sortCalendarEvents(events: CalendarEvent[]): CalendarEvent[] {
  return events.sort((left, right) => {
    const dateCompare = left.date.localeCompare(right.date);
    if (dateCompare !== 0) return dateCompare;
    return left.title.localeCompare(right.title, "pt-BR");
  });
}

export function buildCalendar(): CalendarResponse {
  purgeInvalidCalendarioAcademico();
  const academicRows = getCalendarioAcademico();
  const academicDateGroups = buildAcademicDateDisplayGroups(academicRows);
  const semestreRows = getSemestreAtual();

  const baseEvents = mapCalendarRowsToEvents({
    tarefas: getTarefasForCalendar(),
    eventosManuais: [],
    academicos: [],
  });
  const manualEvents = expandManualCalendarEvents(getEventosCalendario());
  const academicEvents = expandAcademicRowsToCalendarEvents(academicRows);
  const classEvents = expandClassSessionEvents({
    semestreRows,
    academicRows,
  });

  return {
    events: sortCalendarEvents([
      ...baseEvents,
      ...manualEvents,
      ...academicEvents,
      ...classEvents,
    ]),
    academicDates: academicDateGroups.flatMap((group) => group.items),
    academicDateGroups,
  };
}
