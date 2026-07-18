-- M6 — tokens Expo Push por dispositivo (mobile Android)
CREATE TABLE IF NOT EXISTS push_device_tokens (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES app_profiles (user_id) ON DELETE CASCADE,
  cpf TEXT NOT NULL CHECK (cpf ~ '^\d{11}$'),
  expo_push_token TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT 'android',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT push_device_tokens_token_unique UNIQUE (expo_push_token)
);

CREATE INDEX IF NOT EXISTS idx_push_device_tokens_user
  ON push_device_tokens (user_id);

CREATE INDEX IF NOT EXISTS idx_push_device_tokens_cpf
  ON push_device_tokens (cpf);

ALTER TABLE push_device_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_device_tokens FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS push_device_tokens_select_own ON push_device_tokens;
DROP POLICY IF EXISTS push_device_tokens_insert_own ON push_device_tokens;
DROP POLICY IF EXISTS push_device_tokens_delete_own ON push_device_tokens;

CREATE POLICY push_device_tokens_select_own ON push_device_tokens
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY push_device_tokens_insert_own ON push_device_tokens
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY push_device_tokens_delete_own ON push_device_tokens
  FOR DELETE USING (user_id = auth.uid());
