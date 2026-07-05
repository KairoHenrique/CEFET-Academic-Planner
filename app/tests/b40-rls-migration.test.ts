import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it } from "node:test";

const MIGRATION_PATH = resolve(
  __dirname,
  "../../supabase/migrations/20260705180000_b40_rls_multi_tenant.sql"
);

const TENANT_TABLES = [
  "aluno",
  "historico",
  "semestre_atual",
  "notas",
  "faltas",
  "tarefas",
  "grupo_membros",
  "integralizacao",
  "eventos_calendario",
  "configuracoes",
];

const GLOBAL_TABLES = [
  "disciplinas",
  "requisitos",
  "calendario_academico",
  "turmas_ofertadas",
  "app_config",
];

describe("B40 — RLS multi-tenant migration", () => {
  const sql = readFileSync(MIGRATION_PATH, "utf8");

  it("aplica RLS tenant com auth.uid() nas tabelas por aluno", () => {
    for (const table of TENANT_TABLES) {
      assert.match(
        sql,
        new RegExp(`planner_apply_tenant_rls\\('${table}'::regclass\\)`),
        `RLS tenant ausente: ${table}`
      );
    }

    assert.match(sql, /user_id = auth\.uid\(\)/);
    assert.match(sql, /tenant_select_own/);
    assert.match(sql, /FORCE ROW LEVEL SECURITY/);
  });

  it("expõe leitura global para authenticated", () => {
    for (const table of GLOBAL_TABLES) {
      assert.match(
        sql,
        new RegExp(`planner_apply_global_read_rls\\('${table}'::regclass\\)`),
        `RLS global read ausente: ${table}`
      );
    }
  });

  it("protege app_profiles, trial_por_cpf e account_email_queue", () => {
    assert.match(sql, /app_profiles_select_own/);
    assert.match(sql, /trial_por_cpf_select_own/);
    assert.match(sql, /ALTER TABLE account_email_queue ENABLE ROW LEVEL SECURITY/);
  });
});

describe("B40 — tenant context (app layer)", () => {
  it("runWithTenantUserId isola user_id por request", async () => {
    const { runWithTenantUserId, getActiveTenantUserId } = await import(
      "../src/lib/db/postgres/tenant-context"
    );

    const outer = getActiveTenantUserId();
    assert.equal(outer, undefined);

    runWithTenantUserId("11111111-1111-1111-1111-111111111111", () => {
      assert.equal(
        getActiveTenantUserId(),
        "11111111-1111-1111-1111-111111111111"
      );
    });
  });
});
