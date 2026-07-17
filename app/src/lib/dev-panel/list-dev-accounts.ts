import fs from "node:fs";
import path from "node:path";
import { normalizeCpf } from "@/lib/auth/account/cpf";
import { isPostgresBackend } from "@/lib/db/backend/config";
import { getPostgresPool } from "@/lib/db/postgres/pool";
import { ensureDbReady } from "@/lib/db/bootstrap";
import { getAluno } from "@/lib/db/queries";
import {
  normalizeSigaaUsername,
  resolveDbPathForUser,
  runWithUserDb,
} from "@/lib/db/connection-manager";
import { loadSigaaCredentials } from "@/lib/crypto/sigaa-credential-store";
import { cpfLast4, maskCpf } from "@/lib/dev-panel/mask-cpf";
import { resolveDevAccountRef } from "@/lib/dev-panel/dev-account-ref";
import {
  resolvePostgresDevSubscription,
  resolveSqliteDevSubscription,
} from "@/lib/dev-panel/resolve-dev-subscription";
import type { DevAccountRecord } from "@/lib/dev-panel/types";

function matchesQuery(input: {
  cpf: string;
  displayName: string;
  email: string | null;
  matricula: string | null;
  q: string;
}): boolean {
  const needle = input.q.trim().toLowerCase();
  if (!needle) return true;

  const cpfDigits = needle.replace(/\D/g, "");
  return (
    (cpfDigits.length > 0 && normalizeCpf(input.cpf).includes(cpfDigits)) ||
    input.displayName.toLowerCase().includes(needle) ||
    (input.email?.toLowerCase().includes(needle) ?? false) ||
    (input.matricula?.toLowerCase().includes(needle) ?? false)
  );
}

function readSqliteAccount(cpf: string): DevAccountRecord | null {
  const dbPath = resolveDbPathForUser(cpf);
  if (!fs.existsSync(dbPath)) {
    return null;
  }

  return runWithUserDb(cpf, () => {
    ensureDbReady();
    const aluno = getAluno();
    const stored = loadSigaaCredentials();
    const normalized = normalizeSigaaUsername(cpf);
    const credentialSaved =
      Boolean(stored?.password) && stored?.username === normalized;

    return {
      cpf: normalizeCpf(cpf),
      cpfMasked: maskCpf(cpf),
      cpfLast4: cpfLast4(cpf),
      displayName: aluno?.nome?.trim() || `CPF ${cpfLast4(cpf)}`,
      matricula: aluno?.matricula?.trim() || null,
      cursoId: aluno?.curso?.trim() || "eng-computacao",
      email: aluno?.email?.trim() || null,
      credentialSaved,
      lastSyncAt: null,
      subscription: resolveSqliteDevSubscription(cpf),
    };
  });
}

async function listPostgresAccounts(query?: string): Promise<DevAccountRecord[]> {
  const pool = getPostgresPool();
  const q = query?.trim().toLowerCase() ?? "";
  const cpfNeedle = q.replace(/\D/g, "");
  const pattern = q ? `%${q}%` : null;
  const cpfPattern = cpfNeedle ? `%${cpfNeedle}%` : null;

  // JOIN LATERAL: dados sincronizados do aluno (nome/matrícula) quando existirem,
  // permitindo busca por nome, matrícula, e-mail ou CPF em uma única query.
  const result = await pool.query<{
    user_id: string;
    cpf: string;
    email: string;
    curso_id: string;
    updated_at: Date;
    credential_saved: boolean;
    trial_started_at: Date | null;
    aluno_nome: string | null;
    aluno_matricula: string | null;
    sub_plan_id: string | null;
    sub_status: string | null;
    sub_expires_at: Date | null;
  }>(
    `SELECT p.user_id, p.cpf, p.email, p.curso_id, p.updated_at,
            (
              p.sigaa_password_enc IS NOT NULL
              AND length(trim(p.sigaa_password_enc)) > 0
            ) AS credential_saved,
            t.trial_started_at,
            a.nome AS aluno_nome,
            a.matricula AS aluno_matricula,
            s.plan_id AS sub_plan_id,
            s.status AS sub_status,
            s.expires_at AS sub_expires_at
     FROM app_profiles p
     LEFT JOIN trial_por_cpf t ON t.cpf = p.cpf
     LEFT JOIN LATERAL (
       SELECT nome, matricula
       FROM aluno
       WHERE aluno.user_id = p.user_id
       LIMIT 1
     ) a ON true
     LEFT JOIN LATERAL (
       SELECT plan_id, status, expires_at
       FROM subscriptions
       WHERE subscriptions.user_id = p.user_id
       ORDER BY
         CASE status
           WHEN 'active' THEN 0
           WHEN 'pending_payment' THEN 1
           ELSE 2
         END,
         expires_at DESC
       LIMIT 1
     ) s ON true
     WHERE (
       $1::text IS NULL
       OR lower(p.email) LIKE $1
       OR p.cpf LIKE $2
       OR lower(a.nome) LIKE $1
       OR lower(a.matricula) LIKE $1
     )
     ORDER BY p.created_at DESC
     LIMIT 200`,
    [pattern, cpfPattern]
  );

  return result.rows.map((row) => {
    const nome = row.aluno_nome?.trim();
    return {
      userId: row.user_id,
      cpf: normalizeCpf(row.cpf),
      cpfMasked: maskCpf(row.cpf),
      cpfLast4: cpfLast4(row.cpf),
      displayName: nome || row.email.split("@")[0] || `CPF ${cpfLast4(row.cpf)}`,
      matricula: row.aluno_matricula?.trim() || null,
      cursoId: row.curso_id,
      email: row.email,
      credentialSaved: row.credential_saved,
      lastSyncAt: row.updated_at.toISOString(),
      subscription: resolvePostgresDevSubscription(
        row.trial_started_at,
        row.sub_plan_id && row.sub_status && row.sub_expires_at
          ? {
              plan_id: row.sub_plan_id,
              status: row.sub_status,
              expires_at: row.sub_expires_at,
            }
          : null
      ),
    };
  });
}

function listSqliteAccounts(query?: string): DevAccountRecord[] {
  const root = path.join(
    process.env.PLANNER_DATA_ROOT?.trim() || path.join(process.cwd(), ".data"),
    "users"
  );

  const cpfs: string[] = [];
  if (fs.existsSync(root)) {
    cpfs.push(
      ...fs
        .readdirSync(root, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
    );
  }

  if (cpfs.length === 0) {
    cpfs.push("");
  }

  const accounts: DevAccountRecord[] = [];
  for (const cpf of cpfs) {
    const account = readSqliteAccount(cpf);
    if (!account) continue;
    if (
      matchesQuery({
        cpf,
        displayName: account.displayName,
        email: account.email,
        matricula: account.matricula,
        q: query ?? "",
      })
    ) {
      accounts.push(account);
    }
  }

  return accounts;
}

export async function listDevAccounts(query?: string): Promise<DevAccountRecord[]> {
  if (isPostgresBackend()) {
    return listPostgresAccounts(query);
  }

  return listSqliteAccounts(query);
}

export async function listDevTargetCpfs(input: {
  scope: "individual" | "global";
  accountRef?: string;
  query?: string;
}): Promise<string[]> {
  if (input.scope === "individual") {
    const cpf = await resolveDevAccountRef(input.accountRef ?? "");
    return [cpf];
  }

  if (isPostgresBackend()) {
    const pool = getPostgresPool();
    const q = input.query?.trim().toLowerCase() ?? "";
    const cpfNeedle = q.replace(/\D/g, "");
    const result = await pool.query<{ cpf: string }>(
      `SELECT cpf FROM app_profiles
       WHERE sigaa_password_enc IS NOT NULL
         AND length(trim(sigaa_password_enc)) > 0
         AND (
           $1::text IS NULL
           OR lower(email) LIKE $1
           OR cpf LIKE $2
         )
       ORDER BY created_at ASC
       LIMIT 100`,
      [q ? `%${q}%` : null, cpfNeedle ? `%${cpfNeedle}%` : null]
    );
    return result.rows.map((row) => row.cpf);
  }

  const root = path.join(
    process.env.PLANNER_DATA_ROOT?.trim() || path.join(process.cwd(), ".data"),
    "users"
  );
  if (!fs.existsSync(root)) {
    const stored = loadSigaaCredentials();
    return stored?.username ? [normalizeSigaaUsername(stored.username)] : [];
  }

  return fs
    .readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((cpf) => {
      const account = readSqliteAccount(cpf);
      return account?.credentialSaved;
    });
}
