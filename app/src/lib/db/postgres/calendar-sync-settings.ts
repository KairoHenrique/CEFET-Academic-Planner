import { getPostgresPool } from "@/lib/db/postgres/pool";
import {
  DEFAULT_CALENDAR_SYNC_PREFERENCES,
  type CalendarSyncPreferences,
  type CalendarSyncReminderMode,
  type CalendarSyncSettingsView,
} from "@/lib/calendar-sync/types";

const SETTINGS_COLUMNS = `include_aulas, include_tarefas, include_eventos, include_academico,
  reminder_mode, feed_token_hash, feed_created_at, feed_last_accessed_at`;

/** Evita UPDATE a cada fetch do Google (que chega a consultar várias vezes por hora). */
const LAST_ACCESS_TOUCH_INTERVAL = "1 hour";

function toIsoOrNull(value: unknown): string | null {
  if (value instanceof Date) return value.toISOString();
  return typeof value === "string" && value ? value : null;
}

function toReminderMode(value: unknown): CalendarSyncReminderMode {
  return value === "so_tarefas" || value === "nenhum" ? value : "padrao";
}

function mapSettingsRow(row: Record<string, unknown> | undefined): CalendarSyncSettingsView {
  if (!row) {
    return {
      ...DEFAULT_CALENDAR_SYNC_PREFERENCES,
      categories: { ...DEFAULT_CALENDAR_SYNC_PREFERENCES.categories },
      feed: { active: false, createdAt: null, lastAccessedAt: null },
    };
  }
  return {
    categories: {
      aulas: row.include_aulas !== false,
      tarefas: row.include_tarefas !== false,
      eventos: row.include_eventos !== false,
      academico: row.include_academico !== false,
    },
    reminders: toReminderMode(row.reminder_mode),
    feed: {
      active: typeof row.feed_token_hash === "string" && row.feed_token_hash.length > 0,
      createdAt: toIsoOrNull(row.feed_created_at),
      lastAccessedAt: toIsoOrNull(row.feed_last_accessed_at),
    },
  };
}

export async function pgGetCalendarSyncSettings(userId: string): Promise<CalendarSyncSettingsView> {
  const result = await getPostgresPool().query(
    `SELECT ${SETTINGS_COLUMNS} FROM calendar_sync_settings WHERE user_id = $1 LIMIT 1`,
    [userId]
  );
  return mapSettingsRow(result.rows[0]);
}

export async function pgUpsertCalendarSyncPreferences(
  userId: string,
  preferences: CalendarSyncPreferences
): Promise<CalendarSyncSettingsView> {
  const { categories } = preferences;
  const result = await getPostgresPool().query(
    `INSERT INTO calendar_sync_settings (
       user_id, include_aulas, include_tarefas, include_eventos, include_academico, reminder_mode
     ) VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (user_id) DO UPDATE SET
       include_aulas = EXCLUDED.include_aulas,
       include_tarefas = EXCLUDED.include_tarefas,
       include_eventos = EXCLUDED.include_eventos,
       include_academico = EXCLUDED.include_academico,
       reminder_mode = EXCLUDED.reminder_mode,
       updated_at = now()
     RETURNING ${SETTINGS_COLUMNS}`,
    [
      userId,
      categories.aulas,
      categories.tarefas,
      categories.eventos,
      categories.academico,
      preferences.reminders,
    ]
  );
  return mapSettingsRow(result.rows[0]);
}

/** Troca o hash do token (o anterior deixa de funcionar imediatamente). */
export async function pgSetCalendarFeedTokenHash(
  userId: string,
  tokenHash: string | null
): Promise<CalendarSyncSettingsView> {
  const result = await getPostgresPool().query(
    `INSERT INTO calendar_sync_settings (user_id, feed_token_hash, feed_created_at)
     VALUES ($1, $2, CASE WHEN $2::text IS NULL THEN NULL ELSE now() END)
     ON CONFLICT (user_id) DO UPDATE SET
       feed_token_hash = EXCLUDED.feed_token_hash,
       feed_created_at = EXCLUDED.feed_created_at,
       feed_last_accessed_at = NULL,
       updated_at = now()
     RETURNING ${SETTINGS_COLUMNS}`,
    [userId, tokenHash]
  );
  return mapSettingsRow(result.rows[0]);
}

export interface CalendarFeedOwner {
  userId: string;
  preferences: CalendarSyncPreferences;
}

export async function pgFindCalendarFeedOwnerByTokenHash(
  tokenHash: string
): Promise<CalendarFeedOwner | null> {
  const result = await getPostgresPool().query(
    `SELECT user_id, ${SETTINGS_COLUMNS}
     FROM calendar_sync_settings
     WHERE feed_token_hash = $1
     LIMIT 1`,
    [tokenHash]
  );
  const row = result.rows[0];
  if (!row) return null;
  const view = mapSettingsRow(row);
  return {
    userId: String(row.user_id),
    preferences: { categories: view.categories, reminders: view.reminders },
  };
}

export async function pgTouchCalendarFeedAccess(userId: string): Promise<void> {
  await getPostgresPool().query(
    `UPDATE calendar_sync_settings
     SET feed_last_accessed_at = now()
     WHERE user_id = $1
       AND (feed_last_accessed_at IS NULL
            OR feed_last_accessed_at < now() - interval '${LAST_ACCESS_TOUCH_INTERVAL}')`,
    [userId]
  );
}
