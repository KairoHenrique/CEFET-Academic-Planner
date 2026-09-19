-- last_seen_at: atividade do aluno (orchestrator 15d + higiene de dados)
ALTER TABLE app_profiles
  ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_app_profiles_last_seen_at
  ON app_profiles (last_seen_at);

-- Backfill: contas existentes contam como vistas agora (nao cortar sync no deploy)
UPDATE app_profiles
SET last_seen_at = COALESCE(last_seen_at, updated_at, created_at, now())
WHERE last_seen_at IS NULL;
