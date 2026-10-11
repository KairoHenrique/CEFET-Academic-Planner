import { validationError } from "@/lib/api/errors";
import {
  CALENDAR_SYNC_CATEGORIES,
  CALENDAR_SYNC_REMINDER_MODES,
  type CalendarSyncCategory,
  type CalendarSyncPreferences,
  type CalendarSyncReminderMode,
  type PatchCalendarSyncSettingsBody,
} from "@/lib/calendar-sync/types";

const ALLOWED_KEYS = new Set(["categories", "reminders"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function parseCategories(raw: unknown): Partial<Record<CalendarSyncCategory, boolean>> {
  if (!isRecord(raw)) throw validationError("categories deve ser um objeto.");
  const parsed: Partial<Record<CalendarSyncCategory, boolean>> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (!(CALENDAR_SYNC_CATEGORIES as readonly string[]).includes(key)) {
      throw validationError("Categoria de agenda desconhecida.");
    }
    if (typeof value !== "boolean") {
      throw validationError("Cada categoria deve ser verdadeiro ou falso.");
    }
    parsed[key as CalendarSyncCategory] = value;
  }
  return parsed;
}

function parseReminderMode(raw: unknown): CalendarSyncReminderMode {
  if (
    typeof raw !== "string" ||
    !(CALENDAR_SYNC_REMINDER_MODES as readonly string[]).includes(raw)
  ) {
    throw validationError("Modo de lembrete inválido.");
  }
  return raw as CalendarSyncReminderMode;
}

export function parsePatchCalendarSyncSettingsBody(body: unknown): PatchCalendarSyncSettingsBody {
  if (!isRecord(body)) throw validationError("Corpo da requisição inválido.");
  for (const key of Object.keys(body)) {
    if (!ALLOWED_KEYS.has(key)) throw validationError("Campo não permitido.");
  }
  const parsed: PatchCalendarSyncSettingsBody = {};
  if (body.categories !== undefined) parsed.categories = parseCategories(body.categories);
  if (body.reminders !== undefined) parsed.reminders = parseReminderMode(body.reminders);
  if (!parsed.categories && !parsed.reminders) {
    throw validationError("Nada para atualizar.");
  }
  return parsed;
}

export function mergeCalendarSyncPreferences(
  current: CalendarSyncPreferences,
  patch: PatchCalendarSyncSettingsBody
): CalendarSyncPreferences {
  return {
    categories: { ...current.categories, ...patch.categories },
    reminders: patch.reminders ?? current.reminders,
  };
}
