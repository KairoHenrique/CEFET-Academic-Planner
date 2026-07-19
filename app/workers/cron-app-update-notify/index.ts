export interface CronAppUpdateNotifyEnv {
  PLANNER_APP_URL: string;
  CRON_SECRET: string;
}

export default {
  async scheduled(
    _controller: ScheduledController,
    env: CronAppUpdateNotifyEnv
  ): Promise<void> {
    const baseUrl = env.PLANNER_APP_URL?.trim().replace(/\/$/, "");
    if (!baseUrl) {
      console.error("[cron-app-update-notify] PLANNER_APP_URL ausente");
      return;
    }

    const secret = env.CRON_SECRET?.trim();
    if (!secret) {
      console.error("[cron-app-update-notify] CRON_SECRET ausente");
      return;
    }

    const response = await fetch(`${baseUrl}/api/cron/app-update-notify`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${secret}`,
        "content-type": "application/json",
      },
    });

    const body = await response.text();

    console.log(
      `[cron-app-update-notify] status=${response.status} body=${body.slice(0, 300)}`
    );

    if (!response.ok) {
      throw new Error(`App update notify cron falhou: HTTP ${response.status}`);
    }
  },
};
