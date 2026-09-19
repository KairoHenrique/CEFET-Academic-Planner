-- Fase 2: source play + marca de purge academico (login permanece)

ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_source_check;
ALTER TABLE subscriptions
  ADD CONSTRAINT subscriptions_source_check
  CHECK (source IN ('trial', 'pix', 'play', 'gift_key', 'manual', 'referral'));

ALTER TABLE app_profiles
  ADD COLUMN IF NOT EXISTS academic_purged_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_app_profiles_last_seen_purge
  ON app_profiles (last_seen_at)
  WHERE last_seen_at IS NOT NULL;
