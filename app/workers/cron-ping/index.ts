export interface CronPingEnv {
  PLANNER_HEALTH_URL: string;
  CRON_SECRET: string;
}

export default {
  async scheduled(
    _controller: ScheduledController,
    env: CronPingEnv
  ): Promise<void> {
    const baseUrl = env.PLANNER_HEALTH_URL?.trim().replace(/\/$/, "");
    if (!baseUrl) {
      console.error("[cron-ping] PLANNER_HEALTH_URL ausente");
      return;
    }

    const secret = env.CRON_SECRET?.trim();
    const headers: Record<string, string> = {};
    if (secret) {
      headers.authorization = `Bearer ${secret}`;
    }

    // deep=1 1×/dia: barato e mantém o Postgres/Supabase acordado no free.
    const response = await fetch(`${baseUrl}/api/health?deep=1`, { headers });
    const body = await response.text();

    console.log(
      `[cron-ping] status=${response.status} body=${body.slice(0, 200)}`
    );

    if (!response.ok) {
      throw new Error(`Health ping falhou: HTTP ${response.status}`);
    }
  },
};
