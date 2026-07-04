export const DEFAULT_CURSO_ID = "eng-computacao";

export type PlannerDatabaseBackend = "sqlite" | "postgres";

export function resolvePlannerDatabaseBackend(): PlannerDatabaseBackend {
  const mode = process.env.PLANNER_DATABASE?.trim().toLowerCase();
  if (mode === "postgres" && process.env.DATABASE_URL?.trim()) {
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
