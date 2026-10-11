-- Sincronizacao com Google Agenda / Samsung Calendar.
-- Preferencias por aluno (o que entra na agenda + lembretes) e o link secreto do feed .ics.
-- O token do feed NUNCA e salvo em claro: so o SHA-256 (hex). Revogar = apagar o hash.
CREATE TABLE IF NOT EXISTS calendar_sync_settings (
  user_id uuid PRIMARY KEY REFERENCES app_profiles(user_id) ON DELETE CASCADE,
  include_aulas boolean NOT NULL DEFAULT true,
  include_tarefas boolean NOT NULL DEFAULT true,
  include_eventos boolean NOT NULL DEFAULT true,
  include_academico boolean NOT NULL DEFAULT true,
  reminder_mode text NOT NULL DEFAULT 'padrao'
    CHECK (reminder_mode IN ('padrao', 'so_tarefas', 'nenhum')),
  feed_token_hash text UNIQUE,
  feed_created_at timestamptz,
  feed_last_accessed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE calendar_sync_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_select_own ON calendar_sync_settings;
CREATE POLICY tenant_select_own ON calendar_sync_settings
  FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS tenant_insert_own ON calendar_sync_settings;
CREATE POLICY tenant_insert_own ON calendar_sync_settings
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS tenant_update_own ON calendar_sync_settings;
CREATE POLICY tenant_update_own ON calendar_sync_settings
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS tenant_delete_own ON calendar_sync_settings;
CREATE POLICY tenant_delete_own ON calendar_sync_settings
  FOR DELETE TO authenticated USING (user_id = auth.uid());
