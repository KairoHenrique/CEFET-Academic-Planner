export type NotificationKind = "task" | "grade" | "task-reminder";

export interface NotificationSnapshotItem {
  fingerprint: string;
  kind: NotificationKind;
  title: string;
  subtitle: string;
  href: string;
  at: string | null;
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

export interface NotificationsSnapshotResponse {
  items: NotificationSnapshotItem[];
  pendingTasks: PendingTaskReminderSource[];
  capturedAt: string;
}
