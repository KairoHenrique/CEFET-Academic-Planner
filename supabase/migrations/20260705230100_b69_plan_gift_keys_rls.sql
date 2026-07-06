-- B69 — plan_gift_keys: sem RLS tenant (service role + dev operador)

ALTER TABLE plan_gift_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_gift_keys FORCE ROW LEVEL SECURITY;

-- Nenhuma policy para authenticated — acesso via service role (API server-side).

COMMENT ON TABLE plan_gift_keys IS 'B69: RLS ativo sem policy pública; service role only.';
