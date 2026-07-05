-- B62 — Fila de e-mails de conta (promoções + ciclo de vida)

CREATE TABLE IF NOT EXISTS account_email_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users (id) ON DELETE SET NULL,
  cpf TEXT NOT NULL CHECK (cpf ~ '^\d{11}$'),
  to_email TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (
    kind IN (
      'promotion',
      'welcome',
      'trial_ended',
      'plan_expiring_soon',
      'plan_ended'
    )
  ),
  dedupe_key TEXT NOT NULL,
  subject TEXT NOT NULL,
  body_text TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'processing', 'sent', 'failed')
  ),
  scheduled_for TIMESTAMPTZ NOT NULL DEFAULT now(),
  attempts INT NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  last_error TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_account_email_queue_dedupe
  ON account_email_queue (kind, dedupe_key);

CREATE INDEX IF NOT EXISTS idx_account_email_queue_pending
  ON account_email_queue (scheduled_for)
  WHERE status = 'pending';

CREATE OR REPLACE FUNCTION account_email_queue_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS account_email_queue_updated_at ON account_email_queue;
CREATE TRIGGER account_email_queue_updated_at
  BEFORE UPDATE ON account_email_queue
  FOR EACH ROW
  EXECUTE FUNCTION account_email_queue_set_updated_at();

COMMENT ON TABLE account_email_queue IS
  'Fila transacional de e-mails de promoção e ciclo de conta (B62).';
