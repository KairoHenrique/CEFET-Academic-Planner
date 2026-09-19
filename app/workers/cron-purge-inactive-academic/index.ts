export interface CronSyncOrchestratorEnv {
  PLANNER_APP_URL: string;
  CRON_SECRET: string;
}

export default {
  async scheduled(
    _controller: ScheduledController,
    env: CronSyncOrchestratorEnv
  ): Promise<void> {
    const baseUrl = env.PLANNER_APP_URL?.trim().replace(/\/$/, "");
    if (!baseUrl) {
      console.error("[cron-purge-inactive-academic] PLANNER_APP_URL ausente");
      return;
    }

    const secret = env.CRON_SECRET?.trim();
    if (!secret) {
      console.error("[cron-purge-inactive-academic] CRON_SECRET ausente");
      return;
    }

    const response = await fetch(`${baseUrl}/api/cron/purge-inactive-academic`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${secret}`,
        "content-type": "application/json",
      },
    });

    const body = await response.text();

    console.log(
      `[cron-purge-inactive-academic] status=${response.status} body=${body.slice(0, 300)}`
    );

    if (!response.ok) {
      throw new Error(`Purge inactive academic cron falhou: HTTP ${response.status}`);
    }
  },
};
