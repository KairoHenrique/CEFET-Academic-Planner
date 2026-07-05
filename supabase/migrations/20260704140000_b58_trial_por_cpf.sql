-- B58 — Trial por CPF (anti-abuso: 7 dias, uma vez por CPF para sempre)

CREATE TABLE IF NOT EXISTS trial_por_cpf (
  cpf TEXT PRIMARY KEY CHECK (cpf ~ '^\d{11}$'),
  trial_started_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trial_por_cpf_started_at
  ON trial_por_cpf (trial_started_at);

COMMENT ON TABLE trial_por_cpf IS
  'Registro permanente de trial por CPF. Nunca apagar — impede segundo trial.';
