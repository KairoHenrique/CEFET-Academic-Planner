import { buildCalendarFromData } from "@/lib/calendar/build-calendar";
import { buildIntegralizacaoFromQueries } from "@/lib/integralizacao/build-integralizacao-from-queries";
import {
  buildNotificationSnapshotFromData,
  type NotificationSnapshot,
} from "@/lib/notifications/build-notification-snapshot";
import { buildPendingCalendarReminderSourcesFromEvents } from "@/lib/notifications/build-pending-calendar-reminder-sources";
import { DEFAULT_NOTIFICATION_PREFERENCES } from "@/lib/notifications/notification-preferences-shared";
import { pgGetNotificationPreferences } from "@/lib/notifications/notification-preferences-store";
import { postgresQueryDeps } from "@/lib/db/postgres/query-port";
import { getActiveTenantUserId } from "@/lib/db/postgres/tenant-context";
import { findProfileByUserId, hasEncryptedPasswordByCpf } from "@/lib/auth/account/profile-repository";
import { buildCloudSubscription } from "@/lib/perfil/build-perfil-cloud";
import type { PerfilAccount, PerfilSubscription } from "@/lib/types/perfil-api";
import {
  pgGetAllNotas,
  pgGetAllFaltas,
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
    allFaltas,
    academicRows,
    calendarTarefas,
    eventosManuais,
    integralizacao,
    preferences,
    profile,
  ] = await Promise.all([
    pgGetAluno(),
    pgGetSemestreAtual(),
    pgGetTarefas(),
    pgGetAllNotas(),
    pgGetAllFaltas(),
    pgGetCalendarioAcademico(),
    pgGetTarefasForCalendar(),
    pgGetEventosCalendario(),
    buildIntegralizacaoFromQueries(postgresQueryDeps),
    preferencesPromise,
    userId ? findProfileByUserId(userId) : Promise.resolve(null),
  ]);

  let account: PerfilAccount | undefined;
  let subscription: PerfilSubscription | undefined;

  if (profile) {
    const hasPassword = await hasEncryptedPasswordByCpf(profile.cpf);
    account = {
      cpf: profile.cpf,
      email: profile.email,
      phone: profile.telefone,
      sigaaAuthError: !hasPassword,
    };
    subscription = await buildCloudSubscription(profile.cpf);
  }

  const activeIds = new Set(
    semestreRows.map((row) => row.disciplina_id.toLowerCase())
  );
  const notasSemestre = allNotas.filter((nota) =>
    activeIds.has(nota.disciplina_id.toLowerCase())
  );

  const faltasPorDisciplina = new Map<string, number>();
  for (const falta of allFaltas) {
    if (!activeIds.has(falta.disciplina_id.toLowerCase())) continue;
    let count = faltasPorDisciplina.get(falta.disciplina_id) ?? 0;
    if (falta.status === "falta") {
      count += falta.quantidade && falta.quantidade > 0 ? falta.quantidade : 1;
    }
    faltasPorDisciplina.set(falta.disciplina_id, count);
  }

  const { events } = buildCalendarFromData({
    academicRows,
    semestreRows,
    tarefas: calendarTarefas,
    eventosManuais,
  });

  return buildNotificationSnapshotFromData({
    aluno,
    preferences,
    semestreRows,
    tarefas,
    notasSemestre,
    calendarSources: buildPendingCalendarReminderSourcesFromEvents(events),
    integralizacao,
    academicRows,
    faltasPorDisciplina,
    account,
    subscription,
  });
}
