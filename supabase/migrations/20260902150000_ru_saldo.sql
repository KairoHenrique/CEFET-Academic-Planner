-- B80/B81 — Saldo do RU (Refeições Disponíveis) + robô/cron `ru`

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
