export type NotificationKind =
  | "task"
  | "grade"
  | "task-reminder"
  | "calendar-event-reminder"
  | "class-reminder"
  /** B36 — marco de integralização (faixa por categoria de CH). */
  | "integralizacao-alert"
  /** B37 — data acadêmica institucional próxima. */
  | "calendar-date-alert"
  | "absence";

export interface NotificationSnapshotItem {
  fingerprint: string;
  kind: NotificationKind;
  title: string;
  subtitle: string;
  href: string;
  at: string | null;
  /** Preenchido em notificações de nota (avaliação referente está em `title`). */
  disciplinaNome?: string;
  notaObtida?: number;
  notaMaxima?: number | null;
}

export interface PendingTaskReminderSource {
  id: number;
  disciplinaId: string;
  title: string;
  subtitle: string;
  href: string;
  dueDateIso: string;
  dueTime: string;
}

import type { NotificationPreferences } from "@/lib/types/perfil-api";

export interface PendingCalendarReminderSource {
  eventId: string;
  title: string;
  subtitle: string;
  href: string;
  startDateIso: string;
  startTime: string;
}

export interface NotificationsSnapshotResponse {
  items: NotificationSnapshotItem[];
  pendingTasks: PendingTaskReminderSource[];
  /** Eventos manuais e marcos (sem aulas). */
  pendingCalendarEvents: PendingCalendarReminderSource[];
  /** Aulas expandidas da grade. */
  pendingClassSessions: PendingCalendarReminderSource[];
  preferences: NotificationPreferences;
  capturedAt: string;
}
