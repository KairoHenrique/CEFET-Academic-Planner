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
  console.info("[cron] Iniciando runNotificationRemindersCron...");
  const pool = getPostgresPool();
  const result = await pool.query<{ user_id: string; cpf: string }>(
    `SELECT DISTINCT user_id, cpf
     FROM push_device_tokens
     WHERE expo_push_token LIKE 'ExponentPushToken%'`
  );

  let pushed = 0;
  let skipped = 0;
  let errors = 0;

  console.info(`[cron] Encontrados ${result.rows.length} usuários únicos com tokens de push.`);

  for (const row of result.rows) {
    try {
      const outcome = await dispatchNotificationPushesForUser({
        userId: row.user_id,
        cpf: row.cpf,
      });
      if (outcome.sent > 0) {
        pushed += outcome.sent;
      } else {
        skipped += 1;
      }
    } catch (err) {
      console.error(`[cron] Erro ao processar user=${row.user_id.slice(0, 8)}`, err);
      errors += 1;
    }
  }

  console.info(`[cron] Concluído: ${pushed} pushes enviados, ${skipped} pulados, ${errors} erros.`);

  return {
    users: result.rows.length,
    pushed,
    skipped,
    errors,
  };
}
