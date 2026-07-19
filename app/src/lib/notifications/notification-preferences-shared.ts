import type { NotificationKind } from "@/lib/types/notifications-api";
import type { NotificationPreferences } from "@/lib/types/perfil-api";

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  tasks: true,
  grades: true,
  taskReminders: true,
  calendarReminders: true,
  classReminders: false,
  integralizacaoAlerts: true,
  academicDateAlerts: true,
  personalEvents: true,
};

export function isNotificationKindEnabled(
  kind: NotificationKind,
  preferences: NotificationPreferences = DEFAULT_NOTIFICATION_PREFERENCES
): boolean {
  switch (kind) {
    case "task":
      return preferences.tasks;
    case "grade":
      return preferences.grades;
    case "task-reminder":
      return preferences.taskReminders;
    case "calendar-event-reminder":
      return preferences.calendarReminders;
    case "class-reminder":
      return preferences.classReminders;
    case "integralizacao-alert":
      return preferences.integralizacaoAlerts;
    case "calendar-date-alert":
      return preferences.academicDateAlerts;
    default:
      return true;
  }
}
