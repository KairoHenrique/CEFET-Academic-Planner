-- B74 — account_referrals: service role only (API server-side)

ALTER TABLE account_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_referrals FORCE ROW LEVEL SECURITY;

COMMENT ON TABLE account_referrals IS
  'B74: RLS ativo sem policy pública; service role only. Indicação por matrícula.';
