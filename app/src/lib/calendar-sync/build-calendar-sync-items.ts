import type { CalendarEvent } from "@/lib/types/calendar";
import type {
  CalendarSyncCategory,
  CalendarSyncPreferences,
  CalendarSyncReminderMode,
} from "@/lib/calendar-sync/types";

/**
 * Item neutro de agenda — o mesmo modelo alimenta o feed .ics (Google Agenda) e a
 * escrita direta no calendário do Android (expo-calendar).
 */
export interface CalendarSyncItem {
  /** Estável entre syncs (UID do .ics / chave de diff no celular). */
  uid: string;
  category: CalendarSyncCategory;
  title: string;
  notes: string;
  location?: string;
  allDay: boolean;
  /** YYYY-MM-DD (dia inteiro) ou YYYY-MM-DDTHH:mm (horário local de Brasília). */
  start: string;
  /** Exclusivo: dia seguinte no dia inteiro; horário de término no evento com hora. */
  end: string;
  /** Minutos relativos ao início: negativo = antes, positivo = depois. */
  alarmOffsetsMinutes: number[];
  /** Matéria do item — o app cria uma agenda por matéria com a cor dela. */
  subject?: CalendarSyncSubject;
}

export interface CalendarSyncSubject {
  key: string;
  label: string;
  /** #RRGGBB */
  color: string;
}

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

/** Cor da disciplina vem de aulas/tarefas; eventos manuais podem ter cor própria. */
function buildSubjectColorMap(events: CalendarEvent[]): Map<string, string> {
  const colors = new Map<string, string>();
  for (const event of events) {
    const key = event.subjectCode?.trim();
    if (!key || colors.has(key) || !HEX_COLOR.test(event.color)) continue;
    if (event.id.startsWith("aula-") || event.id.startsWith("tarefa-")) {
      colors.set(key, event.color.toUpperCase());
    }
  }
  return colors;
}

function resolveSubject(
  event: CalendarEvent,
  subjectColors: Map<string, string>
): CalendarSyncSubject | undefined {
  const key = event.subjectCode?.trim();
  const label = event.subject?.trim();
  if (!key || !label) return undefined;
  const color = subjectColors.get(key) ?? (HEX_COLOR.test(event.color) ? event.color.toUpperCase() : undefined);
  return color ? { key, label, color } : undefined;
}

/** Janela exportada: evita feed gigante (semestre inteiro de aulas + histórico antigo). */
const PAST_WINDOW_DAYS = 30;
const FUTURE_WINDOW_DAYS = 200;
const DEFAULT_TIMED_DURATION_MINUTES = 60;

const ALARMS = {
  aula: [-15],
  /** Dia inteiro: véspera às 18h (-6 h da meia-noite) e no dia às 8h (+8 h). */
  prazoDiaInteiro: [-6 * 60, 8 * 60],
  prazoComHora: [-24 * 60, -2 * 60],
  evento: [-60],
} as const;

export function resolveCalendarSyncCategory(event: CalendarEvent): CalendarSyncCategory | null {
  if (event.id.startsWith("aula-")) return "aulas";
  if (event.id.startsWith("tarefa-")) return "tarefas";
  if (event.id.startsWith("evento-")) return "eventos";
  if (event.id.startsWith("academico-")) return "academico";
  return null;
}

function shiftIsoDate(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return date.toISOString().slice(0, 10);
}

function addMinutesToTime(time: string, minutes: number): string {
  const [hours, mins] = time.split(":").map(Number);
  const total = Math.min(hours * 60 + mins + minutes, 23 * 60 + 59);
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function isValidIsoDate(value: string | undefined): value is string {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

function isValidTime(value: string | undefined): value is string {
  return Boolean(value && /^\d{2}:\d{2}$/.test(value));
}

function resolveEventTimes(event: CalendarEvent): { start?: string; end?: string } {
  if (event.classTime) return event.classTime;
  return { start: event.timeStart, end: event.timeEnd };
}

function buildTitle(event: CalendarEvent, category: CalendarSyncCategory): string {
  const doneSuffix = event.done ? " (concluída)" : "";
  if (category === "aulas") return event.subject ?? event.title;
  if (category === "tarefas") {
    const prefix = event.type === "prova" ? "Avaliação" : "Prazo";
    const subject = event.subject ? ` — ${event.subject}` : "";
    return `${prefix}: ${event.title}${subject}${doneSuffix}`;
  }
  return `${event.title}${doneSuffix}`;
}

function resolveAlarms(
  category: CalendarSyncCategory,
  timed: boolean,
  done: boolean,
  mode: CalendarSyncReminderMode
): number[] {
  if (mode === "nenhum" || done) return [];
  if (category === "academico") return [];
  if (category === "aulas") return mode === "padrao" ? [...ALARMS.aula] : [];
  if (category === "tarefas") return timed ? [...ALARMS.prazoComHora] : [...ALARMS.prazoDiaInteiro];
  return timed ? [...ALARMS.evento] : [...ALARMS.prazoDiaInteiro];
}

function toSyncItem(
  event: CalendarEvent,
  category: CalendarSyncCategory,
  mode: CalendarSyncReminderMode,
  subjectColors: Map<string, string>
): CalendarSyncItem | null {
  if (!isValidIsoDate(event.date)) return null;
  const times = resolveEventTimes(event);
  const timed = isValidTime(times.start);
  const lastDate = isValidIsoDate(event.dateEnd) ? event.dateEnd : event.date;

  const start = timed ? `${event.date}T${times.start}` : event.date;
  const end = timed
    ? `${lastDate}T${isValidTime(times.end) && times.end !== times.start
        ? times.end
        : addMinutesToTime(times.start!, DEFAULT_TIMED_DURATION_MINUTES)}`
    : shiftIsoDate(lastDate, 1);

  return {
    uid: `${event.id}@acmehub.com.br`,
    category,
    title: buildTitle(event, category),
    notes: event.description,
    location: event.location,
    allDay: !timed,
    start,
    end,
    alarmOffsetsMinutes: resolveAlarms(category, timed, Boolean(event.done), mode),
    subject: category === "academico" ? undefined : resolveSubject(event, subjectColors),
  };
}

export function buildCalendarSyncItems(
  events: CalendarEvent[],
  preferences: CalendarSyncPreferences,
  today: string
): CalendarSyncItem[] {
  const windowStart = shiftIsoDate(today, -PAST_WINDOW_DAYS);
  const windowEnd = shiftIsoDate(today, FUTURE_WINDOW_DAYS);
  const items: CalendarSyncItem[] = [];
  const subjectColors = buildSubjectColorMap(events);

  for (const event of events) {
    const category = resolveCalendarSyncCategory(event);
    if (!category || !preferences.categories[category]) continue;
    const lastDate = event.dateEnd ?? event.date;
    if (lastDate < windowStart || event.date > windowEnd) continue;

    const item = toSyncItem(event, category, preferences.reminders, subjectColors);
    if (item) items.push(item);
  }
  return items;
}

/** "Hoje" no fuso de Brasília (Workers rodam em UTC). */
export function resolveTodayInSaoPaulo(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}
