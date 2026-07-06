-- B72e — Fila de sync compartilhada app cloud ↔ worker Playwright.
--
-- O app (Cloudflare) insere jobs e lê status; o worker hospedado atualiza
-- running/completed/failed. Nenhuma credencial é persistida aqui — a senha
-- selada (AES-GCM) viaja apenas no dispatch HTTPS app → worker.

CREATE TABLE IF NOT EXISTS sync_jobs (
  id text PRIMARY KEY,
  username text NOT NULL,
  lane text NOT NULL DEFAULT 'normal'
    CHECK (lane IN ('priority', 'normal')),
  trigger_source text NOT NULL DEFAULT 'manual'
    CHECK (trigger_source IN ('first_login', 'manual', 'auto')),
  mode text NOT NULL DEFAULT 'full'
    CHECK (mode IN ('full', 'lite', 'deep', 'incremental')),
  status text NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'running', 'completed', 'failed')),
  robot text NOT NULL DEFAULT 'r1'
    CHECK (robot IN ('r1', 'turmas', 'calendario')),
  idempotency_key text,
  created_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz,
  finished_at timestamptz,
  result_json jsonb,
  error_code text,
  error_message text
);

-- Reuso de job ativo por usuário (evita dispatch duplicado do mesmo CPF).
CREATE INDEX IF NOT EXISTS idx_sync_jobs_username_active
  ON sync_jobs (username, created_at)
  WHERE status IN ('queued', 'running');

-- Idempotência (cron/orquestrador reusa job do dia).
CREATE UNIQUE INDEX IF NOT EXISTS idx_sync_jobs_idempotency_active
  ON sync_jobs (idempotency_key)
  WHERE idempotency_key IS NOT NULL AND status IN ('queued', 'running');

-- Limpeza/observabilidade por data.
CREATE INDEX IF NOT EXISTS idx_sync_jobs_created_at
  ON sync_jobs (created_at DESC);

-- Tabela é acessada somente pelo pool server-side (service role).
-- RLS ligado sem policies = nega anon/authenticated via PostgREST.
ALTER TABLE sync_jobs ENABLE ROW LEVEL SECURITY;
