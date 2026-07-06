/**
 * B72 — Sync SIGAA completo + mirror Postgres (executa o papel do worker).
 *
 * Uso (PowerShell):
 *   $env:SIGAA_CPF="..."; $env:SIGAA_PASSWORD="..."; npm run sync:mirror
 *
 * Pipeline: portal + histórico + turma virtual → turmas ofertadas →
 * calendário → mirror Postgres (hook automático em cada runner).
 * O staging SQLite é forçado (PLANNER_DATABASE=sqlite) e o mirror exige
 * DATABASE_URL + SYNC_MIRROR_POSTGRES=true (definidos aqui explicitamente).
 */
process.env.PLANNER_DATABASE = "sqlite";
process.env.SYNC_MIRROR_POSTGRES = process.env.SYNC_MIRROR_POSTGRES ?? "true";

import { ensureDbReady } from "../src/lib/db/bootstrap";
import { runWithUserDb } from "../src/lib/db/connection-manager";
import { closeMirrorPool, getMirrorPool } from "../src/lib/sync-mirror/mirror-config";
import { resolveMirrorTenantByCpf } from "../src/lib/sync-mirror/resolve-mirror-tenant";
import { runCalendarioSync } from "../src/lib/sync/run-calendario-sync";
import { runSync } from "../src/lib/sync/run-sync";
import { runTurmasOfertadasSync } from "../src/lib/sync/run-turmas-ofertadas-sync";

const VERIFY_TABLES_USER = [
  "aluno",
  "historico",
  "semestre_atual",
  "notas",
  "faltas",
  "tarefas",
  "grupo_membros",
  "integralizacao",
  "configuracoes",
] as const;

const VERIFY_TABLES_GLOBAL = ["turmas_ofertadas", "calendario_academico"] as const;

function readCredentialsFromEnv(): { username: string; password: string } {
  const username = process.env.SIGAA_CPF?.trim();
  const password = process.env.SIGAA_PASSWORD;

  if (!username || !password) {
    console.error("Defina SIGAA_CPF e SIGAA_PASSWORD no ambiente.");
    process.exit(1);
  }

  return { username, password };
}

async function verifyPostgresRows(username: string): Promise<void> {
  const pool = getMirrorPool();
  const tenant = await resolveMirrorTenantByCpf(pool, username);

  console.log("\n— Verificação Postgres —");
  if (tenant) {
    for (const table of VERIFY_TABLES_USER) {
      const result = await pool.query(
        `SELECT COUNT(*)::int AS total FROM ${table} WHERE user_id = $1`,
        [tenant.userId]
      );
      console.log(`  ${table.padEnd(22)} ${result.rows[0].total} linha(s)`);
    }
  } else {
    console.warn(
      "  Conta do app não encontrada para o CPF — tabelas por usuário não espelhadas."
    );
  }

  for (const table of VERIFY_TABLES_GLOBAL) {
    const result = await pool.query(
      `SELECT COUNT(*)::int AS total FROM ${table}`
    );
    console.log(`  ${table.padEnd(22)} ${result.rows[0].total} linha(s)`);
  }
}

async function main(): Promise<void> {
  const credentials = readCredentialsFromEnv();

  await runWithUserDb(credentials.username, async () => {
    ensureDbReady();

    console.log("\n[1/3] Sync completo (portal + histórico + turma virtual)…");
    const syncResult = await runSync(
      {
        username: credentials.username,
        password: credentials.password,
        savePassword: false,
      },
      { mode: "full" }
    );
    for (const stage of syncResult.stages) {
      console.log(
        `  etapa ${stage.stage}: ${stage.outcome}${stage.message ? ` — ${stage.message}` : ""}`
      );
    }

    console.log("\n[2/3] Turmas ofertadas…");
    const turmasResult = await runTurmasOfertadasSync(
      { username: credentials.username, password: credentials.password },
      { force: true }
    );
    console.log(`  ${turmasResult.message}`);

    console.log("\n[3/3] Calendário acadêmico…");
    const calendarioResult = await runCalendarioSync(
      { username: credentials.username, password: credentials.password },
      { force: true }
    );
    console.log(`  ${calendarioResult.message}`);
  });

  await verifyPostgresRows(credentials.username);
}

void (async () => {
  try {
    await main();
    console.log("\nsync-and-mirror: concluído.");
  } catch (error) {
    console.error(
      "\nsync-and-mirror: falhou —",
      error instanceof Error ? error.message : error
    );
    process.exitCode = 1;
  } finally {
    await closeMirrorPool().catch(() => undefined);
  }
})();
