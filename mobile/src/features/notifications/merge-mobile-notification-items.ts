import type {
  NotificationKind,
  NotificationPreferences,
  NotificationSnapshotItem,
  PendingCalendarReminderSource,
  PendingTaskReminderSource,
  NotificationsSnapshotResponse,
} from "@acme/api-contracts";

type ReminderSlot = "24h" | "1h";
type CalendarSlot = "new" | "1d" | "0d";

const ONE_HOUR_MS = 60 * 60 * 1000;
const TWENTY_FOUR_HOURS_MS = 24 * ONE_HOUR_MS;
const THIRTY_MINUTES_MS = 30 * 60 * 1000;
const MS_PER_DAY = 86_400_000;

function normalizeTime(raw: string | null | undefined): string {
  const value = (raw ?? "").trim();
  if (!value) return "23:59";
  const match = value.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return "23:59";
  return `${match[1].padStart(2, "0")}:${match[2]}`;
}

/** Horários acadêmicos são sempre Brasília (igual ao backend / SIGAA). */
function getDueDateTime(dateIso: string, time: string): Date {
  return new Date(`${dateIso.trim()}T${normalizeTime(time)}:00-03:00`);
}

function toIsoDate(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function daysBetweenIso(fromIso: string, toIso: string): number {
  const from = new Date(`${fromIso}T12:00:00`).getTime();
  const to = new Date(`${toIso}T12:00:00`).getTime();
  return Math.round((to - from) / MS_PER_DAY);
}

function isKindEnabled(
  kind: NotificationKind,
  preferences: NotificationPreferences
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

function normalizeText(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function taskFingerprint(
  disciplinaId: string,
  title: string,
  dueDateIso: string,
  slot: ReminderSlot
): string {
  return `task-reminder:${disciplinaId.toLowerCase()}|${normalizeText(title)}|${dueDateIso.trim() || "sem-prazo"}|${slot}`;
}

function calendarFingerprint(
  eventId: string,
  startDateIso: string,
  slot: CalendarSlot
): string {
  return `calendar-event-reminder:${eventId}|${startDateIso}|${slot}`;
}

function classFingerprint(eventId: string, startDateIso: string): string {
  return `class-reminder:${eventId}|${startDateIso}|30m`;
}

function activeTaskSlots(
  dueDateIso: string,
  dueTime: string,
  now: Date
): ReminderSlot[] {
  if (!dueDateIso.trim()) return [];
  const due = getDueDateTime(dueDateIso, dueTime);
  if (due.getTime() <= now.getTime()) return [];
  const ms = due.getTime() - now.getTime();
  const slots: ReminderSlot[] = [];
  if (ms <= TWENTY_FOUR_HOURS_MS) slots.push("24h");
  if (ms <= ONE_HOUR_MS) slots.push("1h");
  return slots;
}

function activeCalendarSlots(
  startDateIso: string,
  now: Date
): CalendarSlot[] {
  const trimmed = startDateIso.trim();
  if (!trimmed) return [];
  const days = daysBetweenIso(toIsoDate(now), trimmed);
  if (days < 0) return [];
  const slots: CalendarSlot[] = ["new"];
  if (days === 1) slots.push("1d");
  if (days === 0) slots.push("0d");
  return slots;
}

function isClassIn30m(
  startDateIso: string,
  startTime: string,
  now: Date
): boolean {
  if (!startDateIso.trim()) return false;
  const start = getDueDateTime(startDateIso, startTime);
  if (start.getTime() <= now.getTime()) return false;
  return start.getTime() - now.getTime() <= THIRTY_MINUTES_MS;
}

function buildTaskReminders(
  tasks: PendingTaskReminderSource[],
  now: Date
): NotificationSnapshotItem[] {
  const items: NotificationSnapshotItem[] = [];
  for (const task of tasks) {
    for (const slot of activeTaskSlots(task.dueDateIso, task.dueTime, now)) {
      items.push({
        fingerprint: taskFingerprint(
          task.disciplinaId,
          task.title,
          task.dueDateIso,
          slot
        ),
        kind: "task-reminder",
        title: slot === "24h" ? "Entrega em 24 horas" : "Entrega em 1 hora",
        subtitle: `${
          slot === "24h" ? "Faltam 24h para entregar" : "Faltam 1h para entregar"
        }: ${task.title} · ${task.subtitle}`,
        href: task.href,
        at: task.dueDateIso,
      });
    }
  }
  return items;
}

function buildCalendarReminders(
  events: PendingCalendarReminderSource[],
  now: Date
): NotificationSnapshotItem[] {
  const items: NotificationSnapshotItem[] = [];
  for (const event of events) {
    for (const slot of activeCalendarSlots(event.startDateIso, now)) {
      const title =
        slot === "new"
          ? "Novo evento"
          : slot === "1d"
            ? "Evento amanhã"
            : "Evento hoje";
      const prefix =
        slot === "new" ? "Cadastrado" : slot === "1d" ? "Amanhã" : "Hoje";
      items.push({
        fingerprint: calendarFingerprint(
          event.eventId,
          event.startDateIso,
          slot
        ),
        kind: "calendar-event-reminder",
        title,
        subtitle: `${prefix}: ${event.title} · ${event.subtitle}`,
        href: event.href,
        at: event.startDateIso,
      });
    }
  }
  return items;
}

function buildClassReminders(
  sessions: PendingCalendarReminderSource[],
  now: Date
): NotificationSnapshotItem[] {
  const items: NotificationSnapshotItem[] = [];
  for (const session of sessions) {
    if (!isClassIn30m(session.startDateIso, session.startTime, now)) continue;
    items.push({
      fingerprint: classFingerprint(session.eventId, session.startDateIso),
      kind: "class-reminder",
      title: "Aula em 30 minutos",
      subtitle: `Sua aula começa em 30 min: ${session.title} · ${session.subtitle}`,
      href: session.href,
      at: session.startDateIso,
    });
  }
  return items;
}

function extractReminderTaskTitle(subtitle: string): string | null {
  const match = subtitle.match(/:\s*(.+?)\s·\s/);
  return match?.[1]?.trim().toLowerCase() ?? null;
}

/**
 * Espelho do merge do desktop — lista in-app do Android fica igual ao sino.
 */
export function mergeMobileNotificationItems(
  snapshot: NotificationsSnapshotResponse,
  now = new Date()
): NotificationSnapshotItem[] {
  const prefs = snapshot.preferences;
  const taskReminders = prefs.taskReminders
    ? buildTaskReminders(snapshot.pendingTasks ?? [], now)
    : [];
  const calendarReminders = prefs.calendarReminders
    ? buildCalendarReminders(snapshot.pendingCalendarEvents ?? [], now)
    : [];
  const classReminders = prefs.classReminders
    ? buildClassReminders(snapshot.pendingClassSessions ?? [], now)
    : [];

  const reminderItems = [
    ...taskReminders,
    ...calendarReminders,
    ...classReminders,
  ];

  const remindedDeliveries = new Set(
    taskReminders.map((item) => {
      const title = extractReminderTaskTitle(item.subtitle);
      return title ? `${item.href}|${title}` : item.href;
    })
  );

  const syncItems = (snapshot.items ?? []).filter((item) => {
    if (item.kind !== "task") return true;
    const key = `${item.href}|${item.title.trim().toLowerCase()}`;
    return !remindedDeliveries.has(key);
  });

  const seen = new Set<string>();
  const merged: NotificationSnapshotItem[] = [];
  for (const item of [...reminderItems, ...syncItems]) {
    if (seen.has(item.fingerprint)) continue;
    if (!isKindEnabled(item.kind, prefs)) continue;
    seen.add(item.fingerprint);
    merged.push(item);
  }
  
  merged.sort((a, b) => {
    const timeA = a.at ? new Date(a.at).getTime() : 0;
    const timeB = b.at ? new Date(b.at).getTime() : 0;
    return timeB - timeA;
  });

  return merged;
}
