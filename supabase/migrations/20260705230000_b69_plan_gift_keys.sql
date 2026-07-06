-- B69 — Chaves gift de plano (operador emite · aluno resgata)

CREATE TABLE IF NOT EXISTS plan_gift_keys (
  code CHAR(8) PRIMARY KEY CHECK (code ~ '^[A-Z0-9]{8}$'),
  plan_id TEXT NOT NULL REFERENCES plans (id),
  duration_days INTEGER NOT NULL CHECK (duration_days > 0),
  status TEXT NOT NULL CHECK (
    status IN ('available', 'redeemed', 'revoked', 'expired')
  ),
  key_expires_at TIMESTAMPTZ,
  redeemed_by_cpf TEXT CHECK (
    redeemed_by_cpf IS NULL OR redeemed_by_cpf ~ '^\d{11}$'
  ),
  redeemed_at TIMESTAMPTZ,
  created_by TEXT NOT NULL,
  internal_label TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_plan_gift_keys_status
  ON plan_gift_keys (status);

CREATE INDEX IF NOT EXISTS idx_plan_gift_keys_redeemed_by_cpf
  ON plan_gift_keys (redeemed_by_cpf)
  WHERE redeemed_by_cpf IS NOT NULL;

CREATE OR REPLACE FUNCTION plan_gift_keys_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS plan_gift_keys_updated_at ON plan_gift_keys;
CREATE TRIGGER plan_gift_keys_updated_at
  BEFORE UPDATE ON plan_gift_keys
  FOR EACH ROW
  EXECUTE FUNCTION plan_gift_keys_set_updated_at();

COMMENT ON TABLE plan_gift_keys IS
  'Chaves gift 8 chars A-Z0-9. Emissão operador (B69); resgate único via POST /api/billing/redeem-key.';
