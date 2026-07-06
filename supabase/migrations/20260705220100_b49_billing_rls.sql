-- B49 — RLS billing: plans global read · subscriptions/payments tenant

-- plans — leitura authenticated (catálogo público autenticado)
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS plans_select_authenticated ON plans;
CREATE POLICY plans_select_authenticated ON plans
  FOR SELECT TO authenticated
  USING (active = true);

-- subscriptions — tenant
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS subscriptions_select_own ON subscriptions;
DROP POLICY IF EXISTS subscriptions_insert_own ON subscriptions;
DROP POLICY IF EXISTS subscriptions_update_own ON subscriptions;

CREATE POLICY subscriptions_select_own ON subscriptions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY subscriptions_insert_own ON subscriptions
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- UPDATE de status via service role (webhook B51) — aluno não altera status direto
CREATE POLICY subscriptions_update_own ON subscriptions
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- payments — tenant read + insert; confirmação via service role
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS payments_select_own ON payments;
DROP POLICY IF EXISTS payments_insert_own ON payments;

CREATE POLICY payments_select_own ON payments
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY payments_insert_own ON payments
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

COMMENT ON TABLE plans IS 'B49: RLS SELECT authenticated (active).';
COMMENT ON TABLE subscriptions IS 'B49: RLS tenant (user_id = auth.uid()).';
COMMENT ON TABLE payments IS 'B49: RLS tenant read/insert; webhook usa service role.';
