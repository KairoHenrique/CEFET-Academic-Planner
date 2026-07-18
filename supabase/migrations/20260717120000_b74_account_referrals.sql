-- B74 — Indicação por matrícula do amigo (+3 dias cada, cap 30 dias, só após PIX)

ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_source_check;

ALTER TABLE subscriptions
  ADD CONSTRAINT subscriptions_source_check
  CHECK (source IN ('trial', 'pix', 'gift_key', 'manual', 'referral'));

CREATE TABLE IF NOT EXISTS account_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referred_user_id UUID NOT NULL UNIQUE REFERENCES app_profiles (user_id) ON DELETE CASCADE,
  referred_cpf TEXT NOT NULL CHECK (referred_cpf ~ '^\d{11}$'),
  referrer_user_id UUID NOT NULL REFERENCES app_profiles (user_id) ON DELETE CASCADE,
  referrer_cpf TEXT NOT NULL CHECK (referrer_cpf ~ '^\d{11}$'),
  referrer_matricula TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'rewarded', 'void')
  ),
  referrer_days_granted INTEGER NOT NULL DEFAULT 0 CHECK (referrer_days_granted >= 0),
  referred_days_granted INTEGER NOT NULL DEFAULT 0 CHECK (referred_days_granted >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  rewarded_at TIMESTAMPTZ,
  CHECK (referred_user_id <> referrer_user_id),
  CHECK (referred_cpf <> referrer_cpf)
);

CREATE INDEX IF NOT EXISTS idx_account_referrals_referrer_user_id
  ON account_referrals (referrer_user_id);

CREATE INDEX IF NOT EXISTS idx_account_referrals_status
  ON account_referrals (status);

COMMENT ON TABLE account_referrals IS
  'B74: indicação por matrícula no cadastro. Bônus (+3d cada, cap 30d/usuário) só quando o indicado paga um plano (PIX aprovado).';
