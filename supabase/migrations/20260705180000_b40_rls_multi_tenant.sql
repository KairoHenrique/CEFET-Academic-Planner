-- B40 — RLS multi-tenant (6c)
-- Tenant: user_id = auth.uid() · Global: SELECT authenticated · Service role bypass (Supabase default)

-- ---------------------------------------------------------------------------
-- Helper — políticas CRUD por user_id (tabelas do aluno)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION planner_apply_tenant_rls(p_table regclass)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  t text := p_table::text;
BEGIN
  EXECUTE format('ALTER TABLE %s ENABLE ROW LEVEL SECURITY', p_table);
  EXECUTE format('ALTER TABLE %s FORCE ROW LEVEL SECURITY', p_table);

  EXECUTE format('DROP POLICY IF EXISTS tenant_select_own ON %s', p_table);
  EXECUTE format('DROP POLICY IF EXISTS tenant_insert_own ON %s', p_table);
  EXECUTE format('DROP POLICY IF EXISTS tenant_update_own ON %s', p_table);
  EXECUTE format('DROP POLICY IF EXISTS tenant_delete_own ON %s', p_table);

  EXECUTE format(
    'CREATE POLICY tenant_select_own ON %s FOR SELECT TO authenticated USING (user_id = auth.uid())',
    p_table
  );
  EXECUTE format(
    'CREATE POLICY tenant_insert_own ON %s FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid())',
    p_table
  );
  EXECUTE format(
    'CREATE POLICY tenant_update_own ON %s FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())',
    p_table
  );
  EXECUTE format(
    'CREATE POLICY tenant_delete_own ON %s FOR DELETE TO authenticated USING (user_id = auth.uid())',
    p_table
  );
END;
$$;

SELECT planner_apply_tenant_rls('aluno'::regclass);
SELECT planner_apply_tenant_rls('historico'::regclass);
SELECT planner_apply_tenant_rls('semestre_atual'::regclass);
SELECT planner_apply_tenant_rls('notas'::regclass);
SELECT planner_apply_tenant_rls('faltas'::regclass);
SELECT planner_apply_tenant_rls('tarefas'::regclass);
SELECT planner_apply_tenant_rls('grupo_membros'::regclass);
SELECT planner_apply_tenant_rls('integralizacao'::regclass);
SELECT planner_apply_tenant_rls('eventos_calendario'::regclass);
SELECT planner_apply_tenant_rls('configuracoes'::regclass);

DROP FUNCTION planner_apply_tenant_rls(regclass);

-- ---------------------------------------------------------------------------
-- Catálogo global — leitura para authenticated
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION planner_apply_global_read_rls(p_table regclass)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  EXECUTE format('ALTER TABLE %s ENABLE ROW LEVEL SECURITY', p_table);
  EXECUTE format('ALTER TABLE %s FORCE ROW LEVEL SECURITY', p_table);
  EXECUTE format('DROP POLICY IF EXISTS global_select_authenticated ON %s', p_table);
  EXECUTE format(
    'CREATE POLICY global_select_authenticated ON %s FOR SELECT TO authenticated USING (true)',
    p_table
  );
END;
$$;

SELECT planner_apply_global_read_rls('disciplinas'::regclass);
SELECT planner_apply_global_read_rls('requisitos'::regclass);
SELECT planner_apply_global_read_rls('calendario_academico'::regclass);
SELECT planner_apply_global_read_rls('turmas_ofertadas'::regclass);
SELECT planner_apply_global_read_rls('app_config'::regclass);

DROP FUNCTION planner_apply_global_read_rls(regclass);

-- ---------------------------------------------------------------------------
-- app_profiles — conta do aluno
-- ---------------------------------------------------------------------------

ALTER TABLE app_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_profiles FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS app_profiles_select_own ON app_profiles;
DROP POLICY IF EXISTS app_profiles_update_own ON app_profiles;

CREATE POLICY app_profiles_select_own ON app_profiles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY app_profiles_update_own ON app_profiles
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- INSERT/DELETE via service role (cadastro B44)

-- ---------------------------------------------------------------------------
-- trial_por_cpf — leitura pelo CPF da conta autenticada
-- ---------------------------------------------------------------------------

ALTER TABLE trial_por_cpf ENABLE ROW LEVEL SECURITY;
ALTER TABLE trial_por_cpf FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS trial_por_cpf_select_own ON trial_por_cpf;

CREATE POLICY trial_por_cpf_select_own ON trial_por_cpf
  FOR SELECT TO authenticated
  USING (
    cpf = (
      SELECT cpf FROM app_profiles WHERE user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- account_email_queue — só service role (sem policy authenticated)
-- ---------------------------------------------------------------------------

ALTER TABLE account_email_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_email_queue FORCE ROW LEVEL SECURITY;

COMMENT ON TABLE aluno IS 'B40: RLS tenant_select/insert/update/delete (user_id = auth.uid()).';
