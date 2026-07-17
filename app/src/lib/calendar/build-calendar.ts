import {
  getCalendarioAcademico,
  getEventosCalendario,
  getSemestreAtual,
  getTarefasForCalendar,
  purgeInvalidCalendarioAcademico,
} from "@/lib/db/queries";
import { buildAcademicDateDisplayGroups } from "@/lib/calendar/group-academic-dates";
import { expandAcademicRowsToCalendarEvents } from "@/lib/calendar/expand-academic-calendar-events";
import { mergeKnownInstitutionalDates } from "@/lib/calendar/known-institutional-dates";
import { expandClassSessionEvents } from "@/lib/calendar/expand-class-session-events";
import { expandManualCalendarEvents } from "@/lib/calendar/expand-manual-calendar-events";
import {
  mapCalendarRowsToEvents,
} from "./map-calendar-event";
import type { CalendarResponse } from "@/lib/types/calendar-api";
import type { CalendarEvent } from "@/lib/types/calendar";
import type {
  CalendarioAcademicoRow,
  EventoCalendarioRow,
  SemestreAtualWithDisciplina,
  TarefaCalendarRow,
} from "@/lib/types/db";

export interface CalendarSourceData {
  academicRows: CalendarioAcademicoRow[];
  semestreRows: SemestreAtualWithDisciplina[];
  tarefas: TarefaCalendarRow[];
  eventosManuais: EventoCalendarioRow[];
}

function sortCalendarEvents(events: CalendarEvent[]): CalendarEvent[] {
  return events.sort((left, right) => {
    const dateCompare = left.date.localeCompare(right.date);
    if (dateCompare !== 0) return dateCompare;
    return left.title.localeCompare(right.title, "pt-BR");
  });
}

/** Núcleo backend-agnóstico: monta o calendário a partir dos dados carregados. */
export function buildCalendarFromData(data: CalendarSourceData): CalendarResponse {
  const { semestreRows } = data;
  const academicRows = mergeKnownInstitutionalDates(data.academicRows);
  const academicDateGroups = buildAcademicDateDisplayGroups(academicRows);

  const baseEvents = mapCalendarRowsToEvents({
    tarefas: data.tarefas,
    eventosManuais: [],
    academicos: [],
  });
  const manualEvents = expandManualCalendarEvents(data.eventosManuais);
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

export function buildCalendar(): CalendarResponse {
  purgeInvalidCalendarioAcademico();
  return buildCalendarFromData({
    academicRows: getCalendarioAcademico(),
    semestreRows: getSemestreAtual(),
    tarefas: getTarefasForCalendar(),
    eventosManuais: getEventosCalendario(),
  });
}
