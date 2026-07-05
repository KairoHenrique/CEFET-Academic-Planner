export interface CronAccountEmailsEnv {
  PLANNER_APP_URL: string;
  CRON_SECRET: string;
}

export default {
  async scheduled(
    _controller: ScheduledController,
    env: CronAccountEmailsEnv
  ): Promise<void> {
    const baseUrl = env.PLANNER_APP_URL?.trim().replace(/\/$/, "");
    if (!baseUrl) {
      console.error("[cron-account-emails] PLANNER_APP_URL ausente");
      return;
    }

    const secret = env.CRON_SECRET?.trim();
    if (!secret) {
      console.error("[cron-account-emails] CRON_SECRET ausente");
      return;
    }

    const response = await fetch(`${baseUrl}/api/cron/account-emails`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${secret}`,
        "content-type": "application/json",
      },
    });

    const body = await response.text();

    console.log(
      `[cron-account-emails] status=${response.status} body=${body.slice(0, 300)}`
    );

    if (!response.ok) {
      throw new Error(`Account email cron falhou: HTTP ${response.status}`);
    }
  },
};
