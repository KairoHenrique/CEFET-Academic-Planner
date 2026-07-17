export const dynamic = "force-dynamic";
import { apiSuccess } from "@/lib/api/response";
import { withDb } from "@/lib/api/with-db";
import { isPostgresBackend } from "@/lib/db/backend/config";
import { buildCalendar, buildCalendarFromData } from "@/lib/calendar/build-calendar";
import {
  pgGetCalendarioAcademico,
  pgGetEventosCalendario,
  pgGetSemestreAtual,
  pgGetTarefasForCalendar,
} from "@/lib/db/postgres/queries-read";

export const GET = withDb(async () => {
  if (isPostgresBackend()) {
    const [academicRows, semestreRows, tarefas, eventosManuais] =
      await Promise.all([
        pgGetCalendarioAcademico(),
        pgGetSemestreAtual(),
        pgGetTarefasForCalendar(),
        pgGetEventosCalendario(),
      ]);
    return apiSuccess(
      buildCalendarFromData({
        academicRows,
        semestreRows,
        tarefas,
        eventosManuais,
      })
    );
  }

  return apiSuccess(buildCalendar());
});
