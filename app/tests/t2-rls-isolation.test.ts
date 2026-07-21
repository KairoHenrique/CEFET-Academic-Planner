import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it } from "node:test";
import { buildInternalAuthEmail } from "../src/lib/auth/account/internal-auth-email";

const QUERIES_READ_PATH = resolve(
  __dirname,
  "../src/lib/db/postgres/queries-read.ts"
);

const TENANT_QUERY_EXPORTS = [
  "pgGetAluno",
  "pgGetHistorico",
  "pgGetIntegralizacao",
  "pgGetSemestreAtual",
  "pgGetSemestreAtualByCodigo",
  "pgGetTarefas",
  "pgGetTarefasByDisciplina",
  "pgGetFaltasByDisciplina",
  "pgGetGrupoByDisciplina",
  "pgGetNotasByDisciplina",
] as const;

const T2_CPF_A = "39053344705";
const T2_CPF_B = "52998224725";
const T2_PASSWORD = "T2Smoke!99";

function hasIntegrationEnv(): boolean {
  return Boolean(
    process.env.PLANNER_DATABASE === "postgres" &&
      process.env.DATABASE_URL?.trim() &&
      process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
      process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() &&
      (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim())
  );
}

function extractFunctionBody(source: string, name: string): string {
  const start = source.indexOf(`export async function ${name}`);
  assert.ok(start >= 0, `função ausente: ${name}`);
  const braceStart = source.indexOf("{", start);
  assert.ok(braceStart >= 0, `corpo ausente: ${name}`);

  let depth = 0;
  for (let i = braceStart; i < source.length; i += 1) {
    const char = source[i];
    if (char === "{") depth += 1;
    if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        return source.slice(start, i + 1);
      }
    }
  }

  throw new Error(`corpo incompleto: ${name}`);
}

describe("T2 — queries tenant filtram por user_id (app layer)", () => {
  const source = readFileSync(QUERIES_READ_PATH, "utf8");

  for (const fnName of TENANT_QUERY_EXPORTS) {
    it(`${fnName} exige tenantUserId antes de consultar`, () => {
      const block = extractFunctionBody(source, fnName);
      assert.match(block, /tenantUserId\(\)/);
      assert.match(block, /if \(!userId\)/);
      assert.match(block, /user_id = \$1/);
    });
  }
});

const integrationDescribe = hasIntegrationEnv()
  ? describe
  : describe.skip;

integrationDescribe("T2 — isolamento 2 contas (Postgres + Supabase RLS)", () => {
  const createdUserIds: string[] = [];

  async function cleanupFixtureUsers(): Promise<void> {
    const { createServerSupabaseClient, resetServerSupabaseClientForTests } =
      await import("../src/lib/supabase/client");
    const { closePostgresPool } = await import("../src/lib/db/postgres/pool");

    resetServerSupabaseClientForTests();
    const admin = createServerSupabaseClient();
    const pool = (await import("../src/lib/db/postgres/pool")).getPostgresPool();

    for (const userId of createdUserIds) {
      await pool.query("DELETE FROM historico WHERE user_id = $1", [userId]);
      await pool.query("DELETE FROM aluno WHERE user_id = $1", [userId]);
      await admin.auth.admin.deleteUser(userId).catch(() => undefined);
    }

    await closePostgresPool();
  }

  it("conta A não vê aluno/histórico da conta B (app + RLS)", async () => {
    process.env.PLANNER_DATABASE = "postgres";
    process.env.PLANNER_CURSO_ID = "eng-computacao";

    const { createServerSupabaseClient, resetServerSupabaseClientForTests } =
      await import("../src/lib/supabase/client");
    const { createAnonSupabaseClient } = await import(
      "../src/lib/auth/account/supabase-auth-client"
    );
    const { insertAppProfile } = await import(
      "../src/lib/auth/account/profile-repository"
    );
    const { getPostgresPool } = await import("../src/lib/db/postgres/pool");
    const { runWithTenantUserId } = await import(
      "../src/lib/db/postgres/tenant-context"
    );

    resetServerSupabaseClientForTests();
    const admin = createServerSupabaseClient();
    const pool = getPostgresPool();

    const disciplina = await pool.query<{ codigo: string }>(
      `SELECT codigo FROM disciplinas WHERE curso_id = 'eng-computacao' LIMIT 1`
    );
    const disciplinaId = disciplina.rows[0]?.codigo;
    assert.ok(disciplinaId, "seed PPC ausente — rode npm run db:seed-ppc");

    async function provisionAccount(
      cpf: string,
      label: "Alpha" | "Beta"
    ): Promise<{ userId: string; matricula: string; nome: string }> {
      const authEmail = buildInternalAuthEmail(cpf);
      const existing = await admin.auth.admin.listUsers();
      const found = existing.data.users.find((u) => u.email === authEmail);
      if (found) {
        await pool.query("DELETE FROM historico WHERE user_id = $1", [found.id]);
        await pool.query("DELETE FROM aluno WHERE user_id = $1", [found.id]);
        await admin.auth.admin.deleteUser(found.id);
      }

      const { data: created, error } = await admin.auth.admin.createUser({
        email: authEmail,
        password: T2_PASSWORD,
        email_confirm: true,
      });
      assert.ifError(error);
      assert.ok(created.user?.id, "userId ausente após createUser");

      const userId = created.user.id;
      createdUserIds.push(userId);

      await insertAppProfile({
        userId,
        cpf,
        email: `t2-${label.toLowerCase()}@smoke.test`,
        telefone: "31999990001",
        cursoId: "eng-computacao",
        sigaaPasswordEnc: "t2-test-enc",
      });

      const matricula = `T2-${label}-001`;
      const nome = `Aluno T2 ${label}`;

      await pool.query(
        `INSERT INTO aluno (user_id, matricula, nome, curso)
         VALUES ($1, $2, $3, $4)`,
        [userId, matricula, nome, "EngComp"]
      );
      await pool.query(
        `INSERT INTO historico (user_id, curso_id, disciplina_id, semestre, status)
         VALUES ($1, 'eng-computacao', $2, '2026.1', 'cursando')`,
        [userId, disciplinaId]
      );

      return { userId, matricula, nome };
    }

    const accountA = await provisionAccount(T2_CPF_A, "Alpha");
    const accountB = await provisionAccount(T2_CPF_B, "Beta");

    await (async () => {
      const readAlunoNome = async (userId: string) =>
        runWithTenantUserId(userId, async () => {
          const activeId = (await import("../src/lib/db/postgres/tenant-context"))
            .getActiveTenantUserId();
          assert.equal(activeId, userId);
          const row = await pool.query<{ nome: string; matricula: string }>(
            `SELECT nome, matricula FROM aluno WHERE user_id = $1 LIMIT 1`,
            [activeId]
          );
          return row.rows[0];
        });

      const readHistoricoCount = async (userId: string) =>
        runWithTenantUserId(userId, async () => {
          const activeId = (await import("../src/lib/db/postgres/tenant-context"))
            .getActiveTenantUserId();
          const row = await pool.query<{ count: string }>(
            `SELECT COUNT(*)::text AS count FROM historico WHERE user_id = $1`,
            [activeId]
          );
          return Number(row.rows[0]?.count ?? 0);
        });

      const alunoA = await readAlunoNome(accountA.userId);
      const alunoB = await readAlunoNome(accountB.userId);
      assert.equal(alunoA?.nome, accountA.nome);
      assert.equal(alunoB?.nome, accountB.nome);
      assert.notEqual(alunoA?.matricula, alunoB?.matricula);

      assert.equal(await readHistoricoCount(accountA.userId), 1);
      assert.equal(await readHistoricoCount(accountB.userId), 1);
    })();

    async function fetchAlunoViaRls(cpf: string): Promise<string[]> {
      const anon = createAnonSupabaseClient();
      const { data: session, error: signInError } =
        await anon.auth.signInWithPassword({
          email: buildInternalAuthEmail(cpf),
          password: T2_PASSWORD,
        });
      assert.ifError(signInError);
      assert.ok(session.session?.access_token, "JWT ausente após login");

      const authed = createAnonSupabaseClient();
      await authed.auth.setSession({
        access_token: session.session.access_token,
        refresh_token: session.session.refresh_token,
      });

      const { data, error } = await authed.from("aluno").select("nome");
      assert.ifError(error);
      return (data ?? []).map((row) => String(row.nome));
    }

    const rlsNamesA = await fetchAlunoViaRls(T2_CPF_A);
    const rlsNamesB = await fetchAlunoViaRls(T2_CPF_B);
    assert.deepEqual(rlsNamesA, [accountA.nome]);
    assert.deepEqual(rlsNamesB, [accountB.nome]);
  });

  it("cleanup fixture T2", async () => {
    await cleanupFixtureUsers();
  });
});
