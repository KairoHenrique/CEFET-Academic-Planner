import { buildCalendarFromData } from "@/lib/calendar/build-calendar";
import {
  pgGetCalendarioAcademico,
  pgGetEventosCalendario,
  pgGetSemestreAtual,
  pgGetTarefasForCalendar,
} from "@/lib/db/postgres/queries-read";
import {
  buildCalendarSyncItems,
  resolveTodayInSaoPaulo,
  type CalendarSyncItem,
} from "@/lib/calendar-sync/build-calendar-sync-items";
import type { CalendarSyncPreferences } from "@/lib/calendar-sync/types";

/** Requer contexto de tenant (runWithTenantUserId + runWithQueryCursoId) ativo. */
export async function loadCalendarSyncItems(
  preferences: CalendarSyncPreferences
): Promise<CalendarSyncItem[]> {
  const [academicRows, semestreRows, tarefas, eventosManuais] = await Promise.all([
    pgGetCalendarioAcademico(),
    pgGetSemestreAtual(),
    pgGetTarefasForCalendar(),
    pgGetEventosCalendario(),
  ]);
  const { events } = buildCalendarFromData({
    academicRows,
    semestreRows,
    tarefas,
    eventosManuais,
  });
  return buildCalendarSyncItems(events, preferences, resolveTodayInSaoPaulo());
}
