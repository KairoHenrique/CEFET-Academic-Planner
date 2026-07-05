#!/usr/bin/env node
/**
 * Smoke T2 — 2 contas não veem dados uma da outra.
 * Valida RLS via Supabase Auth + SELECT em `aluno` (JWT por conta).
 * Uso: node scripts/smoke-t2-isolation.mjs
 * Requer app/.env.local com Supabase + DATABASE_URL + PLANNER_APP_URL (opcional).
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ENV_PATH = resolve(__dirname, "..", ".env.local");

const T2_CPF_A = "39053344705";
const T2_CPF_B = "52998224725";
const T2_PASSWORD = "T2Smoke!99";

function parseEnvFile(path) {
  if (!existsSync(path)) {
    throw new Error(`Arquivo não encontrado: ${path}`);
  }
  const vars = {};
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    vars[key] = value;
  }
  return vars;
}

function buildInternalAuthEmail(cpf) {
  return `cpf.${cpf}@accounts.acme-hub.internal`;
}

const env = parseEnvFile(ENV_PATH);
const base = (
  process.argv[2]?.trim() ||
  env.PLANNER_APP_URL?.trim() ||
  env.PLANNER_HEALTH_URL?.trim() ||
  "https://acme-hub.khfm.workers.dev"
).replace(/\/$/, "");

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const anonKey =
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
  env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
const databaseUrl = env.DATABASE_URL?.trim();

for (const [name, value] of [
  ["NEXT_PUBLIC_SUPABASE_URL", supabaseUrl],
  ["SUPABASE_SERVICE_ROLE_KEY", serviceKey],
  ["NEXT_PUBLIC_SUPABASE_ANON_KEY", anonKey],
  ["DATABASE_URL", databaseUrl],
]) {
  if (!value) {
    console.error(`${name} ausente em app/.env.local`);
    process.exit(1);
  }
}

console.log(`Base: ${base}`);

const admin = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const pool = new pg.Pool({ connectionString: databaseUrl, max: 2 });

async function ensureActiveTrial(cpf) {
  await pool.query(
    `INSERT INTO trial_por_cpf (cpf, trial_started_at)
     VALUES ($1, now())
     ON CONFLICT (cpf) DO UPDATE SET trial_started_at = now()`,
    [cpf]
  );
}

async function ensureAccount(cpf, label) {
  const authEmail = buildInternalAuthEmail(cpf);
  const list = await admin.auth.admin.listUsers();
  let user = list.data.users.find((u) => u.email === authEmail);

  if (!user) {
    const { data, error } = await admin.auth.admin.createUser({
      email: authEmail,
      password: T2_PASSWORD,
      email_confirm: true,
    });
    if (error) throw error;
    user = data.user;
  }

  const userId = user.id;
  await pool.query(
    `INSERT INTO app_profiles (user_id, cpf, email, telefone, curso_id, sigaa_password_enc)
     VALUES ($1, $2, $3, $4, 'eng-computacao', 't2-smoke-enc')
     ON CONFLICT (user_id) DO NOTHING`,
    [userId, cpf, `t2-${label}@smoke.test`, "31999990001"]
  );

  const matricula = `T2-SMOKE-${label}`;
  const nome = `Smoke T2 ${label}`;
  await pool.query("DELETE FROM aluno WHERE user_id = $1", [userId]);
  await pool.query(
    `INSERT INTO aluno (user_id, matricula, nome, curso) VALUES ($1, $2, $3, 'EngComp')`,
    [userId, matricula, nome]
  );

  await ensureActiveTrial(cpf);

  return { userId, nome, cpf };
}

async function signIn(cpf) {
  const anon = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await anon.auth.signInWithPassword({
    email: buildInternalAuthEmail(cpf),
    password: T2_PASSWORD,
  });
  if (error || !data.session?.access_token) {
    throw new Error(`Login falhou (${cpf}): ${error?.message ?? "sem token"}`);
  }
  return data.session;
}

async function fetchAlunoViaRls(session, cpf) {
  const authed = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  await authed.auth.setSession({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
  });

  const { data, error } = await authed.from("aluno").select("nome, matricula");
  if (error) {
    throw new Error(`RLS aluno falhou (${cpf}): ${error.message}`);
  }
  return data ?? [];
}

try {
  const accountA = await ensureAccount(T2_CPF_A, "A");
  const accountB = await ensureAccount(T2_CPF_B, "B");

  const sessionA = await signIn(T2_CPF_A);
  const sessionB = await signIn(T2_CPF_B);

  const rowsA = await fetchAlunoViaRls(sessionA, T2_CPF_A);
  const rowsB = await fetchAlunoViaRls(sessionB, T2_CPF_B);

  const nomeA = rowsA[0]?.nome;
  const nomeB = rowsB[0]?.nome;

  console.log(`Conta A (RLS): ${nomeA ?? "(vazio)"} · ${rowsA.length} linha(s)`);
  console.log(`Conta B (RLS): ${nomeB ?? "(vazio)"} · ${rowsB.length} linha(s)`);

  if (nomeA !== accountA.nome || nomeB !== accountB.nome) {
    console.error("Falha: RLS não retornou o aluno correto por conta.");
    process.exit(1);
  }
  if (rowsA.length !== 1 || rowsB.length !== 1) {
    console.error("Falha: cada conta deve ver exatamente 1 linha em aluno.");
    process.exit(1);
  }
  if (nomeA === nomeB) {
    console.error("Falha: contas compartilham o mesmo nome de aluno.");
    process.exit(1);
  }

  console.log("T2 smoke OK — isolamento RLS confirmado.");
  process.exit(0);
} catch (error) {
  console.error(error);
  process.exit(1);
} finally {
  await pool.end();
}
