-- B49 — Billing: plans (catálogo persistido), subscriptions, payments (PIX)

-- ---------------------------------------------------------------------------
-- Catálogo de planos (global — espelha app/src/lib/billing/plan-catalog)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS plans (
  id TEXT PRIMARY KEY CHECK (
    id IN ('month', 'quarter', 'semester', 'year', 'five_year')
  ),
  label TEXT NOT NULL,
  duration_days INTEGER NOT NULL CHECK (duration_days > 0),
  price_cents INTEGER NOT NULL CHECK (price_cents > 0),
  active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO plans (id, label, duration_days, price_cents, sort_order)
VALUES
  ('month', 'Plano mensal', 30, 3000, 10),
  ('quarter', 'Plano trimestre', 91, 5000, 20),
  ('semester', 'Plano semestre', 182, 8500, 30),
  ('year', 'Plano anual', 365, 15000, 40),
  ('five_year', 'Plano 5 anos', 1825, 70000, 50)
ON CONFLICT (id) DO UPDATE SET
  label = EXCLUDED.label,
  duration_days = EXCLUDED.duration_days,
  price_cents = EXCLUDED.price_cents,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

CREATE OR REPLACE FUNCTION plans_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS plans_updated_at ON plans;
CREATE TRIGGER plans_updated_at
  BEFORE UPDATE ON plans
  FOR EACH ROW
  EXECUTE FUNCTION plans_set_updated_at();

COMMENT ON TABLE plans IS
  'Catálogo persistido de planos pagos. Preços base; override operacional via env na API B47.';

-- ---------------------------------------------------------------------------
-- Assinaturas por usuário (histórico + estado atual)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES app_profiles (user_id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL REFERENCES plans (id),
  status TEXT NOT NULL CHECK (
    status IN (
      'trial_active',
      'trial_expired',
      'pending_payment',
      'active',
      'expired',
      'cancelled'
    )
  ),
  source TEXT NOT NULL CHECK (
    source IN ('trial', 'pix', 'gift_key', 'manual')
  ),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id
  ON subscriptions (user_id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status
  ON subscriptions (user_id, status);

CREATE INDEX IF NOT EXISTS idx_subscriptions_expires_at
  ON subscriptions (expires_at);

CREATE OR REPLACE FUNCTION subscriptions_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS subscriptions_updated_at ON subscriptions;
CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION subscriptions_set_updated_at();

COMMENT ON TABLE subscriptions IS
  'Assinatura por período. B51/B52 atualizam status; trial continua em trial_por_cpf.';

-- ---------------------------------------------------------------------------
-- Pagamentos PIX (idempotência via external_reference + idempotency_key)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES app_profiles (user_id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions (id) ON DELETE SET NULL,
  plan_id TEXT NOT NULL REFERENCES plans (id),
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  currency TEXT NOT NULL DEFAULT 'BRL' CHECK (currency = 'BRL'),
  status TEXT NOT NULL CHECK (
    status IN (
      'pending',
      'approved',
      'rejected',
      'expired',
      'cancelled',
      'refunded'
    )
  ),
  gateway TEXT NOT NULL CHECK (
    gateway IN ('mock', 'mercadopago', 'asaas')
  ),
  gateway_payment_id TEXT,
  external_reference TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  payer_cpf TEXT CHECK (payer_cpf IS NULL OR payer_cpf ~ '^\d{11}$'),
  qr_code TEXT,
  expires_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT payments_external_reference_unique UNIQUE (external_reference),
  CONSTRAINT payments_idempotency_key_unique UNIQUE (idempotency_key)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_gateway_payment
  ON payments (gateway, gateway_payment_id)
  WHERE gateway_payment_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_payments_user_status
  ON payments (user_id, status);

CREATE INDEX IF NOT EXISTS idx_payments_pending_expires
  ON payments (expires_at)
  WHERE status = 'pending';

CREATE OR REPLACE FUNCTION payments_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS payments_updated_at ON payments;
CREATE TRIGGER payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION payments_set_updated_at();

COMMENT ON TABLE payments IS
  'Cobranças PIX. external_reference/idempotency_key para checkout idempotente (B50).';
