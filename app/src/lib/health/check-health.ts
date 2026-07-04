import {
  isPostgresBackend,
  resolvePlannerDatabaseBackend,
} from "@/lib/db/backend/config";

export type HealthDatabaseState = "ok" | "skipped" | "error";

export type HealthCheckResult = {
  ok: boolean;
  service: "acme-hub";
  backend: ReturnType<typeof resolvePlannerDatabaseBackend>;
  timestamp: string;
  database?: HealthDatabaseState;
  error?: string;
};

export type HealthCheckDeps = {
  queryPostgres?: () => Promise<void>;
};

export function verifyCronSecret(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return true;
  }

  const authorization = request.headers.get("authorization");
  if (authorization === `Bearer ${secret}`) {
    return true;
  }

  return request.headers.get("x-cron-secret") === secret;
}

export async function runHealthCheck(
  deep: boolean,
  deps: HealthCheckDeps = {}
): Promise<HealthCheckResult> {
  const backend = resolvePlannerDatabaseBackend();
  const base: HealthCheckResult = {
    ok: true,
    service: "acme-hub",
    backend,
    timestamp: new Date().toISOString(),
  };

  if (!deep) {
    return base;
  }

  if (!isPostgresBackend()) {
    return { ...base, database: "skipped" };
  }

  try {
    if (deps.queryPostgres) {
      await deps.queryPostgres();
    } else {
      const { getPostgresPool } = await import("@/lib/db/postgres/pool");
      await getPostgresPool().query("SELECT 1");
    }

    return { ...base, database: "ok" };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Falha ao consultar Postgres.";

    return {
      ...base,
      ok: false,
      database: "error",
      error: message,
    };
  }
}
