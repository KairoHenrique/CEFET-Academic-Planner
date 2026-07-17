import { buildCalendarFromData } from "@/lib/calendar/build-calendar";
import {
  buildNotificationSnapshotFromData,
  type NotificationSnapshot,
} from "@/lib/notifications/build-notification-snapshot";
import { buildPendingCalendarReminderSourcesFromEvents } from "@/lib/notifications/build-pending-calendar-reminder-sources";
import { resolveCloudNotificationPreferences } from "@/lib/perfil/build-perfil-cloud-data";
import {
  pgGetAllNotas,
  pgGetAluno,
  pgGetCalendarioAcademico,
  pgGetEventosCalendario,
  pgGetSemestreAtual,
  pgGetTarefas,
  pgGetTarefasForCalendar,
} from "@/lib/db/postgres/queries-read";

/**
 * Caminho Postgres (cloud) do sino de notificações. Carrega tudo em paralelo,
 * escopado por tenant, e reaproveita o núcleo puro — sem tocar no SQLite.
 */
export async function buildNotificationSnapshotCloud(): Promise<NotificationSnapshot> {
  const [
    aluno,
    semestreRows,
    tarefas,
    allNotas,
    academicRows,
    calendarTarefas,
    eventosManuais,
  ] = await Promise.all([
    pgGetAluno(),
    pgGetSemestreAtual(),
    pgGetTarefas(),
    pgGetAllNotas(),
    pgGetCalendarioAcademico(),
    pgGetTarefasForCalendar(),
    pgGetEventosCalendario(),
  ]);

  const activeIds = new Set(
    semestreRows.map((row) => row.disciplina_id.toLowerCase())
  );
  const notasSemestre = allNotas.filter((nota) =>
    activeIds.has(nota.disciplina_id.toLowerCase())
  );

  const { events } = buildCalendarFromData({
    academicRows,
    semestreRows,
    tarefas: calendarTarefas,
    eventosManuais,
  });

  return buildNotificationSnapshotFromData({
    aluno,
    preferences: resolveCloudNotificationPreferences(),
    semestreRows,
    tarefas,
    notasSemestre,
    calendarSources: buildPendingCalendarReminderSourcesFromEvents(events),
  });
}
