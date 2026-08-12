-- Envio de tarefas SIGAA via worker Playwright (M18 / B79).

ALTER TABLE tarefas
  ADD COLUMN IF NOT EXISTS sigaa_link_id TEXT;

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

-- sync_jobs: robot submit-tarefa
ALTER TABLE sync_jobs DROP CONSTRAINT IF EXISTS sync_jobs_robot_check;
ALTER TABLE sync_jobs ADD CONSTRAINT sync_jobs_robot_check
  CHECK (robot IN ('r1', 'turmas', 'calendario', 'turmas-selecionadas', 'submit-tarefa'));
