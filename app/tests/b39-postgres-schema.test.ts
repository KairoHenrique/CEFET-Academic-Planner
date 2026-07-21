import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, it } from "node:test";

const MIGRATIONS_DIR = resolve(__dirname, "../../supabase/migrations");

const GLOBAL_TABLES = [
  "disciplinas",
  "requisitos",
  "calendario_academico",
  "turmas_ofertadas",
  "app_config",
];

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

function readInitialMigration(): string {
  const files = readdirSync(MIGRATIONS_DIR)
    .filter((name) => name.endsWith(".sql"))
    .sort();
  assert.ok(files.length > 0, "esperada ao menos uma migration SQL");
  return readFileSync(join(MIGRATIONS_DIR, files[0]!), "utf8");
}

function tableBlock(sql: string, table: string): string {
  const match = sql.match(
    new RegExp(`CREATE TABLE IF NOT EXISTS ${table}\\s*\\([\\s\\S]*?\\);`)
  );
  assert.ok(match, `bloco ausente: ${table}`);
  return match[0]!;
}

describe("B39 — schema Postgres", () => {
  it("migration inicial declara tabelas globais e por aluno", () => {
    const sql = readInitialMigration();

    for (const table of GLOBAL_TABLES) {
      const block = tableBlock(sql, table);
      assert.match(
        sql,
        new RegExp(`CREATE TABLE IF NOT EXISTS ${table}\\b`),
        `tabela global ausente: ${table}`
      );
      assert.doesNotMatch(
        block,
        /\buser_id\b/i,
        `tabela global não deve ter user_id: ${table}`
      );
    }

    for (const table of TENANT_TABLES) {
      const block = tableBlock(sql, table);
      assert.match(
        block,
        /\buser_id UUID\b/i,
        `tabela tenant sem user_id: ${table}`
      );
    }
  });

  it("disciplinas usa chave composta curso_id + codigo", () => {
    const sql = readInitialMigration();
    assert.match(sql, /PRIMARY KEY \(curso_id, codigo\)/);
  });
});
