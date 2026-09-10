import { unauthorizedError } from "@/lib/api/errors";
import { apiErrorResponse, apiSuccess } from "@/lib/api/response";
import { isPostgresBackend } from "@/lib/db/backend/config";
import { withCloudPostgresClient } from "@/lib/db/postgres/cloud-request-client";
import { getPostgresPool } from "@/lib/db/postgres/pool";
import { verifyCronSecret } from "@/lib/health/check-health";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MIGRATION_FILE = "20260812120000_task_submissions.sql";

const MIGRATION_SQL = `
ALTER TABLE tarefas ADD COLUMN IF NOT EXISTS sigaa_link_id TEXT;

CREATE TABLE IF NOT EXISTS task_submissions (
  id text PRIMARY KEY,
  user_id uuid NOT NULL,
  curso_id text NOT NULL DEFAULT 'eng-computacao',
  tarefa_id bigint NOT NULL,
  sigaa_link_id text NOT NULL,
  file_name text NOT NULL,
  file_mime text,
  file_size integer NOT NULL CHECK (file_size > 0 AND file_size <= 10485760),
  file_bytes bytea NOT NULL,
  comment_text text,
  status text NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'running', 'completed', 'failed')),
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz,
  finished_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_task_submissions_user_status
  ON task_submissions (user_id, status, created_at DESC);

ALTER TABLE task_submissions ENABLE ROW LEVEL SECURITY;

ALTER TABLE sync_jobs DROP CONSTRAINT IF EXISTS sync_jobs_robot_check;
ALTER TABLE sync_jobs ADD CONSTRAINT sync_jobs_robot_check
  CHECK (robot IN ('r1', 'turmas', 'calendario', 'turmas-selecionadas', 'submit-tarefa'));

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
