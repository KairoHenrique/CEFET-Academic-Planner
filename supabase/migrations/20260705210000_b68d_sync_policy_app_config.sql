-- B68d — Policy operacional sync em app_config (global, sem user_id)

INSERT INTO app_config (chave, valor)
VALUES (
  'sync.policy.overrides',
  '{}'::jsonb
)
ON CONFLICT (chave) DO NOTHING;

COMMENT ON TABLE app_config IS
  'Configuração global da aplicação (sem user_id). Policy sync: sync.policy.overrides · estado orquestrador: sync.state.*';
