import { buildCalendarEventReminderItems, buildClassSessionReminderItems } from "@/lib/notifications/calendar-event-reminder-items";
import { buildTaskDeadlineReminderItems } from "@/lib/notifications/task-deadline-reminders";
import { isNotificationKindEnabled } from "@/lib/notifications/notification-preferences-shared";
import type {
  NotificationSnapshotItem,
  PendingCalendarReminderSource,
  PendingTaskReminderSource,
} from "@/lib/types/notifications-api";
import type { NotificationPreferences } from "@/lib/types/perfil-api";

function mergeByFingerprint(
  syncItems: NotificationSnapshotItem[],
  reminderItems: NotificationSnapshotItem[]
): NotificationSnapshotItem[] {
  const seen = new Set<string>();
  const merged: NotificationSnapshotItem[] = [];
  for (const item of [...reminderItems, ...syncItems]) {
    if (seen.has(item.fingerprint)) continue;
    seen.add(item.fingerprint);
    merged.push(item);
  }
  return merged;
}

function extractReminderTaskTitle(subtitle: string): string | null {
  const match = subtitle.match(/:\s*(.+?)\s·\s/);
  return match?.[1]?.trim().toLowerCase() ?? null;
}

/** Evita tarefa nova + lembrete de prazo para a mesma entrega. */
function dedupeTaskAgainstReminders(
  items: NotificationSnapshotItem[],
  reminderItems: NotificationSnapshotItem[]
): NotificationSnapshotItem[] {
  if (reminderItems.length === 0) return items;

  const remindedDeliveries = new Set(
    reminderItems
      .filter((item) => item.kind === "task-reminder")
      .map((item) => {
        const title = extractReminderTaskTitle(item.subtitle);
        return title ? `${item.href}|${title}` : item.href;
      })
  );

  return items.filter((item) => {
    if (item.kind !== "task") return true;
    const key = `${item.href}|${item.title.trim().toLowerCase()}`;
    return !remindedDeliveries.has(key);
  });
}

/**
 * Mesma regra do sino desktop (`useNotifications`): mescla itens sync +
 * lembretes ativos (tarefa / calendário / aula) filtrados por prefs.
 */
export function buildActiveNotificationItems(input: {
  items: NotificationSnapshotItem[];
  pendingTasks: PendingTaskReminderSource[];
  pendingCalendarEvents: PendingCalendarReminderSource[];
  pendingClassSessions: PendingCalendarReminderSource[];
  preferences: NotificationPreferences;
  now?: Date;
}): NotificationSnapshotItem[] {
  const now = input.now ?? new Date();
  const prefs = input.preferences;

  const taskReminders = prefs.taskReminders
    ? buildTaskDeadlineReminderItems(input.pendingTasks, now)
    : [];
  const calendarReminders = prefs.calendarReminders
    ? buildCalendarEventReminderItems(input.pendingCalendarEvents, now)
    : [];
  const classReminders = prefs.classReminders
    ? buildClassSessionReminderItems(input.pendingClassSessions, now)
    : [];

  const reminderItems = [
    ...taskReminders,
    ...calendarReminders,
    ...classReminders,
  ];

  const merged = dedupeTaskAgainstReminders(
    mergeByFingerprint(input.items, reminderItems),
    taskReminders
  );

  return merged.filter((item) =>
    isNotificationKindEnabled(item.kind, prefs)
  );
}
