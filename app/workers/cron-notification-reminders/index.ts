export interface CronNotificationRemindersEnv {
  PLANNER_APP_URL: string;
  CRON_SECRET: string;
}

async function postCron(
  baseUrl: string,
  secret: string,
  path: string
): Promise<void> {
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${secret}`,
      "content-type": "application/json",
    },
  });
  const body = await response.text();
  console.log(
    `[cron] ${path} status=${response.status} body=${body.slice(0, 300)}`
  );
  if (!response.ok) {
    throw new Error(`${path} falhou: HTTP ${response.status}`);
  }
}

export default {
  async scheduled(
    _controller: ScheduledController,
    env: CronNotificationRemindersEnv
  ): Promise<void> {
    const baseUrl = env.PLANNER_APP_URL?.trim().replace(/\/$/, "");
    if (!baseUrl) {
      console.error("[cron-notification-reminders] PLANNER_APP_URL ausente");
      return;
    }

    const secret = env.CRON_SECRET?.trim();
    if (!secret) {
      console.error("[cron-notification-reminders] CRON_SECRET ausente");
      return;
    }

    await postCron(baseUrl, secret, "/api/cron/notification-reminders");

    // B81 — Saldo do RU (~1h antes: 09:30 / 18:00 BRT; no-op fora das janelas).
    // Acoplado aqui: conta Free sem slot extra de schedule no CF.
    try {
      await postCron(baseUrl, secret, "/api/cron/ru-saldo");
    } catch (error) {
      console.warn(
        "[cron-notification-reminders] RU saldo tick falhou (nao bloqueia):",
        error instanceof Error ? error.message : error
      );
    }
  },
};
