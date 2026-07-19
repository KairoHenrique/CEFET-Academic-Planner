import { getPostgresPool } from "@/lib/db/postgres/pool";
import { dispatchNotificationPushesForUser } from "@/lib/push/dispatch-notification-pushes";

export type NotificationRemindersCronResult = {
  users: number;
  pushed: number;
  skipped: number;
  errors: number;
};

/**
 * Percorre todos os aparelhos registrados e empurra lembretes/itens
 * ativos (respeitando prefs) que ainda não foram enviados.
 */
export async function runNotificationRemindersCron(): Promise<NotificationRemindersCronResult> {
  const pool = getPostgresPool();
  const result = await pool.query<{ user_id: string; cpf: string }>(
    `SELECT DISTINCT user_id, cpf
     FROM push_device_tokens
     WHERE expo_push_token LIKE 'ExponentPushToken%'`
  );

  let pushed = 0;
  let skipped = 0;
  let errors = 0;

  for (const row of result.rows) {
    try {
      const outcome = await dispatchNotificationPushesForUser({
        userId: row.user_id,
        cpf: row.cpf,
        fallbackSyncToast: false,
      });
      if (outcome.sent > 0) {
        pushed += outcome.sent;
      } else {
        skipped += 1;
      }
    } catch {
      errors += 1;
    }
  }

  return {
    users: result.rows.length,
    pushed,
    skipped,
    errors,
  };
}
