-- B32–B34: persistência de simulações de matrícula (por usuário)

CREATE TABLE IF NOT EXISTS simulador_simulacoes (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  curso_id TEXT NOT NULL DEFAULT 'eng-computacao',
  titulo TEXT NOT NULL,
  semestre TEXT NOT NULL,
  payload_json JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_simulador_simulacoes_user
  ON simulador_simulacoes (user_id, curso_id, updated_at DESC);

-- B34 — RLS tenant (user_id = auth.uid())
ALTER TABLE simulador_simulacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE simulador_simulacoes FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS simulador_simulacoes_select_own ON simulador_simulacoes;
DROP POLICY IF EXISTS simulador_simulacoes_insert_own ON simulador_simulacoes;
DROP POLICY IF EXISTS simulador_simulacoes_update_own ON simulador_simulacoes;
DROP POLICY IF EXISTS simulador_simulacoes_delete_own ON simulador_simulacoes;

CREATE POLICY simulador_simulacoes_select_own ON simulador_simulacoes
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY simulador_simulacoes_insert_own ON simulador_simulacoes
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY simulador_simulacoes_update_own ON simulador_simulacoes
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY simulador_simulacoes_delete_own ON simulador_simulacoes
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

COMMENT ON TABLE simulador_simulacoes IS 'B34: simulações de matrícula por usuário; RLS tenant.';
