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
      console.error("[cron-sync-orchestrator] PLANNER_APP_URL ausente");
      return;
    }

    const secret = env.CRON_SECRET?.trim();
    if (!secret) {
      console.error("[cron-sync-orchestrator] CRON_SECRET ausente");
      return;
    }

    const response = await fetch(`${baseUrl}/api/cron/sync-orchestrator`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${secret}`,
        "content-type": "application/json",
      },
    });

    const body = await response.text();

    console.log(
      `[cron-sync-orchestrator] status=${response.status} body=${body.slice(0, 300)}`
    );

    if (!response.ok) {
      throw new Error(`Sync orchestrator cron falhou: HTTP ${response.status}`);
    }
  },
};
