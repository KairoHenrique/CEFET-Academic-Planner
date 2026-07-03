import { getConfig, setConfig } from "@/lib/db/queries";
import { DEFAULT_NOTIFICATION_PREFERENCES } from "@/lib/notifications/notification-preferences-shared";
import type { NotificationPreferences } from "@/lib/types/perfil-api";

export {
  DEFAULT_NOTIFICATION_PREFERENCES,
  isNotificationKindEnabled,
} from "@/lib/notifications/notification-preferences-shared";

const CONFIG_KEYS = {
  tasks: "notifications.pref.tasks",
  grades: "notifications.pref.grades",
  taskReminders: "notifications.pref.task_reminders",
  calendarReminders: "notifications.pref.calendar_reminders",
  classReminders: "notifications.pref.class_reminders",
} as const;

function readBooleanConfig(key: string, fallback: boolean): boolean {
  const raw = getConfig(key);
  if (raw === null || raw === undefined) return fallback;
  if (raw === "0" || raw === "false") return false;
  if (raw === "1" || raw === "true") return true;
  return fallback;
}

export function getNotificationPreferences(): NotificationPreferences {
  return {
    tasks: readBooleanConfig(CONFIG_KEYS.tasks, DEFAULT_NOTIFICATION_PREFERENCES.tasks),
    grades: readBooleanConfig(CONFIG_KEYS.grades, DEFAULT_NOTIFICATION_PREFERENCES.grades),
    taskReminders: readBooleanConfig(
      CONFIG_KEYS.taskReminders,
      DEFAULT_NOTIFICATION_PREFERENCES.taskReminders
    ),
    calendarReminders: readBooleanConfig(
      CONFIG_KEYS.calendarReminders,
      DEFAULT_NOTIFICATION_PREFERENCES.calendarReminders
    ),
    classReminders: readBooleanConfig(
      CONFIG_KEYS.classReminders,
      DEFAULT_NOTIFICATION_PREFERENCES.classReminders
    ),
  };
}

export function saveNotificationPreferences(
  patch: Partial<NotificationPreferences>
): NotificationPreferences {
  const current = getNotificationPreferences();
  const definedPatch = Object.fromEntries(
    Object.entries(patch).filter((entry): entry is [keyof NotificationPreferences, boolean] => {
      return typeof entry[1] === "boolean";
    })
  ) as Partial<NotificationPreferences>;
  const next: NotificationPreferences = { ...current, ...definedPatch };

  setConfig(CONFIG_KEYS.tasks, next.tasks ? "1" : "0");
  setConfig(CONFIG_KEYS.grades, next.grades ? "1" : "0");
  setConfig(CONFIG_KEYS.taskReminders, next.taskReminders ? "1" : "0");
  setConfig(CONFIG_KEYS.calendarReminders, next.calendarReminders ? "1" : "0");
  setConfig(CONFIG_KEYS.classReminders, next.classReminders ? "1" : "0");

  return next;
}
