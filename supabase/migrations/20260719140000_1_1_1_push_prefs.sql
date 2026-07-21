CREATE TABLE IF NOT EXISTS user_push_prefs (
  user_id text PRIMARY KEY REFERENCES app_profiles(id) ON DELETE CASCADE,
  alert_grades boolean NOT NULL DEFAULT true,
  alert_absences boolean NOT NULL DEFAULT true,
  alert_tasks boolean NOT NULL DEFAULT true,
  alert_classes boolean NOT NULL DEFAULT true,
  alert_system boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Habilitar RLS e Políticas (se estivermos usando Supabase Auth real para essa tabela)
ALTER TABLE user_push_prefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own push prefs" 
ON user_push_prefs FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own push prefs" 
ON user_push_prefs FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own push prefs" 
ON user_push_prefs FOR UPDATE 
USING (auth.uid() = user_id);
