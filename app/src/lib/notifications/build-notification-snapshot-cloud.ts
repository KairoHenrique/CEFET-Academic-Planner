import { buildCalendarFromData } from "@/lib/calendar/build-calendar";
import { buildIntegralizacaoFromQueries } from "@/lib/integralizacao/build-integralizacao-from-queries";
import {
  buildNotificationSnapshotFromData,
  type NotificationSnapshot,
} from "@/lib/notifications/build-notification-snapshot";
import { buildPendingCalendarReminderSourcesFromEvents } from "@/lib/notifications/build-pending-calendar-reminder-sources";
import { DEFAULT_NOTIFICATION_PREFERENCES } from "@/lib/notifications/notification-preferences-shared";
import { pgGetNotificationPreferences } from "@/lib/notifications/notification-preferences-store";
import { pgGetNotificationHistory, pgSaveNotificationHistory } from "@/lib/push/push-sent-fingerprints-store";
import { postgresQueryDeps } from "@/lib/db/postgres/query-port";
import { getActiveTenantUserId } from "@/lib/db/postgres/tenant-context";
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
  const userId = getActiveTenantUserId();
  const preferencesPromise = userId
    ? pgGetNotificationPreferences(userId)
    : Promise.resolve({ ...DEFAULT_NOTIFICATION_PREFERENCES });

  const [
    aluno,
    semestreRows,
    tarefas,
    allNotas,
    academicRows,
    calendarTarefas,
    eventosManuais,
    integralizacao,
    preferences,
  ] = await Promise.all([
    pgGetAluno(),
    pgGetSemestreAtual(),
    pgGetTarefas(),
    pgGetAllNotas(),
    pgGetCalendarioAcademico(),
    pgGetTarefasForCalendar(),
    pgGetEventosCalendario(),
    buildIntegralizacaoFromQueries(postgresQueryDeps),
    preferencesPromise,
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

  const snapshot = buildNotificationSnapshotFromData({
    aluno,
    preferences,
    semestreRows,
    tarefas,
    notasSemestre,
    calendarSources: buildPendingCalendarReminderSourcesFromEvents(events),
    integralizacao,
    academicRows,
  });

  if (userId) {
    const history = await pgGetNotificationHistory(userId);
    let changed = false;
    const now = new Date().toISOString();

    for (const item of snapshot.items) {
      const state = history.get(item.fingerprint);
      if (!state) {
        history.set(item.fingerprint, {
          fingerprint: item.fingerprint,
          discoveredAt: now,
          isRead: false,
          pushed: false,
        });
        changed = true;
        item.discoveredAt = now;
        item.isRead = false;
      } else {
        item.discoveredAt = state.discoveredAt;
        item.isRead = state.isRead;
      }
    }

    if (changed) {
      await pgSaveNotificationHistory(userId, history);
    }

    snapshot.items.sort((a, b) => {
      const timeA = a.discoveredAt ? new Date(a.discoveredAt).getTime() : 0;
      const timeB = b.discoveredAt ? new Date(b.discoveredAt).getTime() : 0;
      return timeB - timeA;
    });
  }

  return snapshot;
}
