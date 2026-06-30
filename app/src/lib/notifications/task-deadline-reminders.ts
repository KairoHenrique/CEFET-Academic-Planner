import { getTaskDueDateTime, normalizeTime } from "@/lib/tasks/dates";
import type {
  NotificationSnapshotItem,
  PendingTaskReminderSource,
} from "@/lib/types/notifications-api";

export type TaskReminderSlot = "24h" | "1h";

const ONE_HOUR_MS = 60 * 60 * 1000;
const TWENTY_FOUR_HOURS_MS = 24 * ONE_HOUR_MS;

export function buildTaskReminderFingerprint(
  taskId: number,
  slot: TaskReminderSlot
): string {
  return `task-reminder:${taskId}:${slot}`;
}

export function getActiveTaskReminderSlots(
  task: Pick<PendingTaskReminderSource, "dueDateIso" | "dueTime">,
  now: Date
): TaskReminderSlot[] {
  if (!task.dueDateIso.trim()) return [];

  const due = getTaskDueDateTime(task.dueDateIso, normalizeTime(task.dueTime));
  if (due.getTime() <= now.getTime()) return [];

  const msUntilDue = due.getTime() - now.getTime();
  const slots: TaskReminderSlot[] = [];

  if (msUntilDue <= TWENTY_FOUR_HOURS_MS) {
    slots.push("24h");
  }
  if (msUntilDue <= ONE_HOUR_MS) {
    slots.push("1h");
  }

  return slots;
}

function buildReminderTitle(slot: TaskReminderSlot): string {
  return slot === "24h" ? "Entrega em 24 horas" : "Entrega em 1 hora";
}

function buildReminderSubtitle(
  task: PendingTaskReminderSource,
  slot: TaskReminderSlot
): string {
  const prefix =
    slot === "24h"
      ? "Faltam 24h para entregar"
      : "Faltam 1h para entregar";
  return `${prefix}: ${task.title} · ${task.subtitle}`;
}

export function buildTaskDeadlineReminderItems(
  tasks: PendingTaskReminderSource[],
  now = new Date()
): NotificationSnapshotItem[] {
  const items: NotificationSnapshotItem[] = [];

  for (const task of tasks) {
    for (const slot of getActiveTaskReminderSlots(task, now)) {
      items.push({
        fingerprint: buildTaskReminderFingerprint(task.id, slot),
        kind: "task-reminder",
        title: buildReminderTitle(slot),
        subtitle: buildReminderSubtitle(task, slot),
        href: task.href,
        at: task.dueDateIso,
      });
    }
  }

  return items;
}
