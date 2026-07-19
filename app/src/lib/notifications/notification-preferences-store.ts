import { getPostgresPool } from "@/lib/db/postgres/pool";
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
} from "@/lib/notifications/notification-preferences-shared";
import type { NotificationPreferences } from "@/lib/types/perfil-api";

export const NOTIFICATION_PREFERENCES_CONFIG_KEY =
  "prefs.notification_preferences";

const PREF_KEYS = [
  "tasks",
  "grades",
  "taskReminders",
  "calendarReminders",
  "classReminders",
  "integralizacaoAlerts",
  "academicDateAlerts",
] as const satisfies ReadonlyArray<keyof NotificationPreferences>;

function parseNotificationPreferences(
  raw: string | null | undefined
): NotificationPreferences {
  if (!raw?.trim()) {
    return { ...DEFAULT_NOTIFICATION_PREFERENCES };
  }

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const next = { ...DEFAULT_NOTIFICATION_PREFERENCES };

    for (const key of PREF_KEYS) {
      if (typeof parsed[key] === "boolean") {
        next[key] = parsed[key];
      }
    }

    return next;
  } catch {
    return { ...DEFAULT_NOTIFICATION_PREFERENCES };
  }
}

function sanitizePatch(
  patch: Partial<NotificationPreferences>
): Partial<NotificationPreferences> {
  const next: Partial<NotificationPreferences> = {};
  for (const key of PREF_KEYS) {
    if (typeof patch[key] === "boolean") {
      next[key] = patch[key];
    }
  }
  return next;
}

/** Preferências de notificação no Postgres (tenant / cloud). */
export async function pgGetNotificationPreferences(
  userId: string
): Promise<NotificationPreferences> {
  const result = await getPostgresPool().query<{ valor: string }>(
    `SELECT valor FROM configuracoes
     WHERE user_id = $1 AND chave = $2
     LIMIT 1`,
    [userId, NOTIFICATION_PREFERENCES_CONFIG_KEY]
  );
  return parseNotificationPreferences(result.rows[0]?.valor);
}

export async function pgSaveNotificationPreferences(
  userId: string,
  preferences: NotificationPreferences
): Promise<NotificationPreferences> {
  const cleaned = sanitizePatch(preferences);
  const next: NotificationPreferences = {
    ...DEFAULT_NOTIFICATION_PREFERENCES,
    ...cleaned,
  };

  await getPostgresPool().query(
    `INSERT INTO configuracoes (user_id, chave, valor)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id, chave) DO UPDATE SET valor = EXCLUDED.valor`,
    [userId, NOTIFICATION_PREFERENCES_CONFIG_KEY, JSON.stringify(next)]
  );

  return next;
}

export async function pgMergeNotificationPreferences(
  userId: string,
  patch: Partial<NotificationPreferences>
): Promise<NotificationPreferences> {
  const current = await pgGetNotificationPreferences(userId);
  return pgSaveNotificationPreferences(userId, {
    ...current,
    ...sanitizePatch(patch),
  });
}
