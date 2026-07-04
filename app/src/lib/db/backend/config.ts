export const DEFAULT_CURSO_ID = "eng-computacao";

export type PlannerDatabaseBackend = "sqlite" | "postgres";

export function isCloudDeployment(): boolean {
  const flag = process.env.PLANNER_CLOUD?.trim().toLowerCase();
  if (flag === "true" || flag === "1") {
    return true;
  }
  if (flag === "false" || flag === "0") {
    return false;
  }

  return (
    process.env.CF_PAGES === "1" ||
    process.env.CLOUDFLARE === "1" ||
    typeof (globalThis as { Cloudflare?: unknown }).Cloudflare !== "undefined"
  );
}

export function resolvePlannerDatabaseBackend(): PlannerDatabaseBackend {
  const hasDatabaseUrl = Boolean(process.env.DATABASE_URL?.trim());
  const mode = process.env.PLANNER_DATABASE?.trim().toLowerCase();

  if (mode === "postgres" && hasDatabaseUrl) {
    return "postgres";
  }

  if (isCloudDeployment()) {
    return "postgres";
  }

  return "sqlite";
}

export function isPostgresBackend(): boolean {
  return resolvePlannerDatabaseBackend() === "postgres";
}

export function resolveDefaultCursoId(): string {
  return process.env.PLANNER_CURSO_ID?.trim() || DEFAULT_CURSO_ID;
}
