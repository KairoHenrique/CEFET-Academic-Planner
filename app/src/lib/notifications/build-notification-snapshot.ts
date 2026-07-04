import { notFoundError } from "@/lib/api/errors";
import {
  getAluno,
  getNotasForSemestreAtual,
  getSemestreAtual,
  getTarefas,
} from "@/lib/db/queries";
import { buildPendingCalendarReminderSources } from "@/lib/notifications/build-pending-calendar-reminder-sources";
import {
  buildGradeNotificationFingerprint,
  buildTaskNotificationFingerprint,
} from "@/lib/notifications/notification-fingerprint";
import {
  getNotificationPreferences,
  isNotificationKindEnabled,
} from "@/lib/notifications/notification-preferences";
import { buildGradeNotificationSubtitle } from "@/lib/notifications/grade-notification-copy";
import { normalizeTime } from "@/lib/tasks/dates";
import type {
  NotificationSnapshotItem,
  PendingCalendarReminderSource,
  PendingTaskReminderSource,
} from "@/lib/types/notifications-api";

/** Tarefas concluídas ou sem prazo não entram no sino. */
export function isTaskEligibleForNotification(row: {
  concluida: number;
  data_fim: string | null;
}): boolean {
  if (row.concluida === 1) return false;
  return Boolean(row.data_fim?.trim());
}

export function buildNotificationSnapshot(): {
  items: NotificationSnapshotItem[];
  pendingTasks: PendingTaskReminderSource[];
  pendingCalendarEvents: PendingCalendarReminderSource[];
  pendingClassSessions: PendingCalendarReminderSource[];
  preferences: ReturnType<typeof getNotificationPreferences>;
  capturedAt: string;
} {
  const aluno = getAluno();
  if (!aluno) {
    throw notFoundError(
      "Nenhum dado sincronizado. Faça login e sincronize com o SIGAA."
    );
  }

  const preferences = getNotificationPreferences();
  const semestreRows = getSemestreAtual();
  const activeIds = new Set(
    semestreRows.map((row) => row.disciplina_id.toLowerCase())
  );
  const nameByCode = new Map(
    semestreRows.map((row) => [row.disciplina_id, row.nome])
  );

  const items: NotificationSnapshotItem[] = [];
  const pendingTasks: PendingTaskReminderSource[] = [];

  for (const row of getTarefas()) {
    if (!activeIds.has(row.disciplina_id.toLowerCase())) continue;
    if (!isTaskEligibleForNotification(row)) continue;

    const disciplinaNome =
      nameByCode.get(row.disciplina_id) ?? row.disciplina_id;

    pendingTasks.push({
      id: row.id,
      disciplinaId: row.disciplina_id,
      title: row.titulo,
      subtitle: disciplinaNome,
      href: `/disciplinas/${encodeURIComponent(row.disciplina_id)}`,
      dueDateIso: row.data_fim,
      dueTime: normalizeTime(row.hora_fim),
    });

    if (isNotificationKindEnabled("task", preferences)) {
      items.push({
        fingerprint: buildTaskNotificationFingerprint(
          row.disciplina_id,
          row.titulo,
          row.data_fim
        ),
        kind: "task",
        title: row.titulo,
        subtitle: disciplinaNome,
        href: `/disciplinas/${encodeURIComponent(row.disciplina_id)}`,
        at: row.data_fim,
      });
    }
  }

  if (isNotificationKindEnabled("grade", preferences)) {
    for (const row of getNotasForSemestreAtual()) {
      if (row.nota_obtida === null) continue;

      const disciplinaNome =
        nameByCode.get(row.disciplina_id) ?? row.disciplina_id;

      items.push({
        fingerprint: buildGradeNotificationFingerprint(
          row.disciplina_id,
          row.avaliacao_nome,
          row.nota_obtida
        ),
        kind: "grade",
        title: row.avaliacao_nome,
        subtitle: buildGradeNotificationSubtitle(
          disciplinaNome,
          row.nota_obtida,
          row.nota_maxima
        ),
        href: `/disciplinas/${encodeURIComponent(row.disciplina_id)}`,
        at: null,
        disciplinaNome,
        notaObtida: row.nota_obtida,
        notaMaxima: row.nota_maxima,
      });
    }
  }

  items.sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === "task" ? -1 : 1;
    const aDate = a.at ?? "";
    const bDate = b.at ?? "";
    return aDate.localeCompare(bDate);
  });

  const calendarSources = buildPendingCalendarReminderSources();

  return {
    items,
    pendingTasks,
    pendingCalendarEvents: calendarSources.events,
    pendingClassSessions: calendarSources.classes,
    preferences,
    capturedAt: new Date().toISOString(),
  };
}
