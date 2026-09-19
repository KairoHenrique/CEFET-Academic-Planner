import { getPostgresPool } from "@/lib/db/postgres/pool";
import { dispatchNotificationPushesForUser } from "@/lib/push/dispatch-notification-pushes";
import {
  getAppConfigJson,
  setAppConfigJson,
} from "@/lib/sync-policy/app-config-store";

export type NotificationRemindersCronResult = {
  users: number;
  scanned: number;
  pushed: number;
  skipped: number;
  errors: number;
  cursor: string | null;
};

const CURSOR_KEY = "cron.notification_reminders.cursor";
/** Workers Free (~10ms CPU): processar poucos usuários por tick. */
const USERS_PER_TICK = 2;

type CursorState = {
  afterUserId?: string;
};

function parseCursor(raw: unknown): CursorState {
  if (!raw || typeof raw !== "object") return {};
  const afterUserId = (raw as { afterUserId?: unknown }).afterUserId;
  return typeof afterUserId === "string" && afterUserId.trim()
    ? { afterUserId: afterUserId.trim() }
    : {};
}

/**
 * Round-robin leve: no máximo USERS_PER_TICK usuários por invocação.
 * Mantém o acme-hub abaixo do limite do plano Free.
 */
export async function runNotificationRemindersCron(): Promise<NotificationRemindersCronResult> {
  const pool = getPostgresPool();
  const cursor = parseCursor(await getAppConfigJson(CURSOR_KEY));

  const result = cursor.afterUserId
    ? await pool.query<{ user_id: string; cpf: string }>(
        `SELECT DISTINCT user_id, cpf
         FROM push_device_tokens
         WHERE expo_push_token LIKE 'ExponentPushToken%'
           AND user_id > $1
         ORDER BY user_id ASC
         LIMIT $2`,
        [cursor.afterUserId, USERS_PER_TICK]
      )
    : await pool.query<{ user_id: string; cpf: string }>(
        `SELECT DISTINCT user_id, cpf
         FROM push_device_tokens
         WHERE expo_push_token LIKE 'ExponentPushToken%'
         ORDER BY user_id ASC
         LIMIT $1`,
        [USERS_PER_TICK]
      );

  let rows = result.rows;

  // Fim da lista → reinicia do começo nesta mesma tick (se ainda houver vagas).
  if (rows.length === 0 && cursor.afterUserId) {
    const restart = await pool.query<{ user_id: string; cpf: string }>(
      `SELECT DISTINCT user_id, cpf
       FROM push_device_tokens
       WHERE expo_push_token LIKE 'ExponentPushToken%'
       ORDER BY user_id ASC
       LIMIT $1`,
      [USERS_PER_TICK]
    );
    rows = restart.rows;
  }

  let pushed = 0;
  let skipped = 0;
  let errors = 0;

  for (const row of rows) {
    try {
      const outcome = await dispatchNotificationPushesForUser({
        userId: row.user_id,
        cpf: row.cpf,
        source: "cron",
      });
      if (outcome.sent > 0) {
        pushed += outcome.sent;
      } else {
        skipped += 1;
      }
    } catch (err) {
      console.error(
        `[cron] Erro ao processar user=${row.user_id.slice(0, 8)}`,
        err
      );
      errors += 1;
    }
  }

  const nextAfter = rows.length > 0 ? rows[rows.length - 1]!.user_id : null;
  await setAppConfigJson(CURSOR_KEY, {
    afterUserId: nextAfter,
    updatedAt: new Date().toISOString(),
  });

  return {
    users: rows.length,
    scanned: rows.length,
    pushed,
    skipped,
    errors,
    cursor: nextAfter,
  };
}
