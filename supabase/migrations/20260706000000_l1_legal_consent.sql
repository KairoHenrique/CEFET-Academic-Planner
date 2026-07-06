-- L1 — Consentimento versionado (Termos de Uso + Política de Privacidade)

ALTER TABLE app_profiles
  ADD COLUMN IF NOT EXISTS terms_version TEXT,
  ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS privacy_version TEXT,
  ADD COLUMN IF NOT EXISTS privacy_accepted_at TIMESTAMPTZ;

COMMENT ON COLUMN app_profiles.terms_version IS 'Versão dos Termos de Uso aceita no cadastro (ex.: 2026-07-01).';
COMMENT ON COLUMN app_profiles.privacy_version IS 'Versão da Política de Privacidade aceita no cadastro.';
