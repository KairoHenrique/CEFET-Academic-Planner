import { unauthorizedError } from "@/lib/api/errors";
import { apiErrorResponse, apiSuccess } from "@/lib/api/response";
import { isPostgresBackend } from "@/lib/db/backend/config";
import { withCloudPostgresClient } from "@/lib/db/postgres/cloud-request-client";
import { getPostgresPool } from "@/lib/db/postgres/pool";
import { verifyCronSecret } from "@/lib/health/check-health";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MIGRATION_FILE = "20260902150000_ru_saldo.sql";

const MIGRATION_SQL = `
ALTER TABLE aluno
  ADD COLUMN IF NOT EXISTS refeicoes_disponiveis INTEGER;

ALTER TABLE aluno
  ADD COLUMN IF NOT EXISTS ru_synced_at TIMESTAMPTZ;

ALTER TABLE sync_jobs DROP CONSTRAINT IF EXISTS sync_jobs_robot_check;
ALTER TABLE sync_jobs
  ADD CONSTRAINT sync_jobs_robot_check
  CHECK (robot IN (
    'r1',
    'turmas',
    'calendario',
    'turmas-selecionadas',
    'submit-tarefa',
    'ru'
  ));

CREATE TABLE IF NOT EXISTS planner_schema_migrations (
  id BIGSERIAL PRIMARY KEY,
  filename TEXT NOT NULL UNIQUE,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO planner_schema_migrations (filename)
VALUES ('${MIGRATION_FILE}')
ON CONFLICT (filename) DO NOTHING;
`;

export async function POST(request: Request) {
  if (!verifyCronSecret(request)) {
    return apiErrorResponse(unauthorizedError("Cron não autorizado."));
  }

  if (!isPostgresBackend()) {
    return apiSuccess({
      ok: true as const,
      skipped: true as const,
      reason: "Postgres backend não ativo.",
    });
  }

  try {
    await withCloudPostgresClient(async () => {
      await getPostgresPool().query(MIGRATION_SQL);
    });
    return apiSuccess({ ok: true as const, migration: MIGRATION_FILE });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
