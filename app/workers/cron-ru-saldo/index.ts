export interface CronRuSaldoEnv {
  PLANNER_APP_URL: string;
  CRON_SECRET: string;
}

/**
 * Dispara POST /api/cron/ru-saldo.
 * Crons: 13:00 UTC (10:00 BRT) e 21:30 UTC (18:30 BRT) + ticks */10 na hora
 * para processar a fila em lotes.
 */
export default {
  async scheduled(
    _controller: ScheduledController,
    env: CronRuSaldoEnv
  ): Promise<void> {
    const baseUrl = env.PLANNER_APP_URL?.trim().replace(/\/$/, "");
    if (!baseUrl) {
      console.error("[cron-ru-saldo] PLANNER_APP_URL ausente");
      return;
    }

    const secret = env.CRON_SECRET?.trim();
    if (!secret) {
      console.error("[cron-ru-saldo] CRON_SECRET ausente");
      return;
    }

    const response = await fetch(`${baseUrl}/api/cron/ru-saldo`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${secret}`,
        "content-type": "application/json",
      },
    });

    const body = await response.text();
    console.log(
      `[cron-ru-saldo] status=${response.status} body=${body.slice(0, 400)}`
    );

    if (!response.ok) {
      throw new Error(`RU saldo cron falhou: HTTP ${response.status}`);
    }
  },
};
