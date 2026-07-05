-- B44 — Conta do aluno (perfil + FK auth.users)
-- Login app = CPF; identidade Supabase Auth usa e-mail interno derivado do CPF.

CREATE TABLE IF NOT EXISTS app_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  cpf TEXT NOT NULL CHECK (cpf ~ '^\d{11}$'),
  email TEXT NOT NULL,
  telefone TEXT NOT NULL CHECK (telefone ~ '^\d{10,11}$'),
  curso_id TEXT NOT NULL CHECK (
    curso_id IN ('eng-computacao', 'eng-mecatronica', 'design-moda')
  ),
  sigaa_password_enc TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_app_profiles_cpf ON app_profiles (cpf);
CREATE UNIQUE INDEX IF NOT EXISTS idx_app_profiles_email_lower
  ON app_profiles (lower(email));

CREATE OR REPLACE FUNCTION app_profiles_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS app_profiles_updated_at ON app_profiles;
CREATE TRIGGER app_profiles_updated_at
  BEFORE UPDATE ON app_profiles
  FOR EACH ROW
  EXECUTE FUNCTION app_profiles_set_updated_at();
