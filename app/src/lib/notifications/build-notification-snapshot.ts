import { notFoundError } from "@/lib/api/errors";
import {
  getAluno,
  getCalendarioAcademico,
  getNotasForSemestreAtual,
  getSemestreAtual,
  getTarefas,
} from "@/lib/db/queries";
import { buildIntegralizacao } from "@/lib/integralizacao/build-integralizacao";
import { buildAcademicDateAlertItems } from "@/lib/notifications/build-academic-date-alert-items";
import { buildIntegralizacaoAlertItems } from "@/lib/notifications/build-integralizacao-alert-items";
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
  AlunoRow,
  CalendarioAcademicoRow,
  NotaRow,
  SemestreAtualWithDisciplina,
  TarefaRow,
} from "@/lib/types/db";
import type { IntegralizacaoResponse } from "@/lib/types/integralizacao-api";
import type { NotificationKind } from "@/lib/types/notifications-api";
import type { NotificationPreferences } from "@/lib/types/perfil-api";
import type {
  NotificationSnapshotItem,
  PendingCalendarReminderSource,
  PendingTaskReminderSource,
} from "@/lib/types/notifications-api";

/** Tarefas concluídas ou sem prazo não entram no sino. */
export function isTaskEligibleForNotification<
  T extends { concluida: number; data_fim: string | null },
>(row: T): row is T & { data_fim: string } {
  if (row.concluida === 1) return false;
  return Boolean(row.data_fim?.trim());
}

export interface NotificationSnapshotData {
  aluno: AlunoRow | undefined;
  preferences: NotificationPreferences;
  semestreRows: SemestreAtualWithDisciplina[];
  tarefas: TarefaRow[];
  notasSemestre: NotaRow[];
  calendarSources: {
    events: PendingCalendarReminderSource[];
    classes: PendingCalendarReminderSource[];
  };
  /** B36 — integralização já calculada (marcos por categoria de CH). */
  integralizacao: IntegralizacaoResponse | null;
  /** B37 — linhas do calendário acadêmico (datas institucionais próximas). */
  academicRows: CalendarioAcademicoRow[];
}

/** Tasks antes de notas; alertas derivados ao final, ordenados por data. */
const KIND_DISPLAY_ORDER: Record<NotificationKind, number> = {
  task: 0,
  "task-reminder": 0,
  grade: 1,
  "calendar-event-reminder": 2,
  "calendar-date-alert": 2,
  "class-reminder": 2,
  "integralizacao-alert": 3,
  absence: 4,
  "grade-risk": 4,
  "task-late": 4,
  "absence-failed": 4,
  "morning-summary": 5,
  "graduation-alert": 5,
  "plan-expiring": 6,
  promo: 7,
  "subscription-renewed": 7,
  "invalid-password": 8,
  "app-updated": 9,
};

export interface NotificationSnapshot {
  items: NotificationSnapshotItem[];
  pendingTasks: PendingTaskReminderSource[];
  pendingCalendarEvents: PendingCalendarReminderSource[];
  pendingClassSessions: PendingCalendarReminderSource[];
  preferences: NotificationPreferences;
  capturedAt: string;
}

/** Núcleo puro — recebe dados já carregados (SQLite local ou Postgres cloud). */
export function buildNotificationSnapshotFromData(
  data: NotificationSnapshotData
): NotificationSnapshot {
  const { aluno, preferences, semestreRows, tarefas, notasSemestre } = data;
  if (!aluno) {
    throw notFoundError(
      "Nenhum dado sincronizado. Faça login e sincronize com o SIGAA."
    );
  }

  const activeIds = new Set(
    semestreRows.map((row) => row.disciplina_id.toLowerCase())
  );
  const nameByCode = new Map(
    semestreRows.map((row) => [row.disciplina_id, row.nome])
  );

  const items: NotificationSnapshotItem[] = [];
  const pendingTasks: PendingTaskReminderSource[] = [];

  for (const row of tarefas) {
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
    for (const row of notasSemestre) {
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
          row.nota_maxima,
          row.avaliacao_nome
        ),
        href: `/disciplinas/${encodeURIComponent(row.disciplina_id)}`,
        at: null,
        disciplinaNome,
        notaObtida: row.nota_obtida,
        notaMaxima: row.nota_maxima,
      });
    }
  }

  if (isNotificationKindEnabled("integralizacao-alert", preferences)) {
    items.push(...buildIntegralizacaoAlertItems(data.integralizacao));
  }

  if (isNotificationKindEnabled("calendar-date-alert", preferences)) {
    items.push(...buildAcademicDateAlertItems(data.academicRows));
  }

  items.sort((a, b) => {
    const orderA = KIND_DISPLAY_ORDER[a.kind];
    const orderB = KIND_DISPLAY_ORDER[b.kind];
    if (orderA !== orderB) return orderA - orderB;
    return (a.at ?? "").localeCompare(b.at ?? "");
  });

  return {
    items,
    pendingTasks,
    pendingCalendarEvents: data.calendarSources.events,
    pendingClassSessions: data.calendarSources.classes,
    preferences,
    capturedAt: new Date().toISOString(),
  };
}

/** Caminho SQLite (dev/PC) — carrega os dados e delega ao núcleo puro. */
export function buildNotificationSnapshot(): NotificationSnapshot {
  const aluno = getAluno();

  return buildNotificationSnapshotFromData({
    aluno,
    preferences: getNotificationPreferences(),
    semestreRows: getSemestreAtual(),
    tarefas: getTarefas(),
    notasSemestre: getNotasForSemestreAtual(),
    calendarSources: buildPendingCalendarReminderSources(),
    integralizacao: aluno ? buildIntegralizacao() : null,
    academicRows: aluno ? getCalendarioAcademico() : [],
  });
}
