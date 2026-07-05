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
import {
  resolvePostgresDevSubscription,
  resolveSqliteDevSubscription,
} from "@/lib/dev-panel/resolve-dev-subscription";
import type { DevAccountView } from "@/lib/dev-panel/types";

function matchesQuery(input: {
  cpf: string;
  displayName: string;
  email: string | null;
  q: string;
}): boolean {
  const needle = input.q.trim().toLowerCase();
  if (!needle) return true;

  const cpfDigits = needle.replace(/\D/g, "");
  return (
    (cpfDigits.length > 0 && normalizeCpf(input.cpf).includes(cpfDigits)) ||
    input.displayName.toLowerCase().includes(needle) ||
    (input.email?.toLowerCase().includes(needle) ?? false)
  );
}

function readSqliteAccount(cpf: string): DevAccountView | null {
  const dbPath = resolveDbPathForUser(cpf);
  if (!fs.existsSync(dbPath)) {
    return null;
  }

  return runWithUserDb(cpf, () => {
    ensureDbReady();
    const aluno = getAluno();
    const stored = loadSigaaCredentials();
    const normalized = normalizeSigaaUsername(cpf);
    const hasPassword =
      Boolean(stored?.password) && stored?.username === normalized;

    return {
      cpf: normalizeCpf(cpf),
      cpfMasked: maskCpf(cpf),
      cpfLast4: cpfLast4(cpf),
      displayName: aluno?.nome?.trim() || `CPF ${cpfLast4(cpf)}`,
      cursoId: aluno?.curso?.trim() || "eng-computacao",
      email: aluno?.email?.trim() || null,
      hasSigaaPassword: hasPassword,
      lastSyncAt: null,
      subscription: resolveSqliteDevSubscription(cpf),
    };
  });
}

async function listPostgresAccounts(query?: string): Promise<DevAccountView[]> {
  const pool = getPostgresPool();
  const q = query?.trim().toLowerCase() ?? "";
  const cpfNeedle = q.replace(/\D/g, "");
  const pattern = q ? `%${q}%` : null;
  const cpfPattern = cpfNeedle ? `%${cpfNeedle}%` : null;

  const result = await pool.query<{
    cpf: string;
    email: string;
    curso_id: string;
    sigaa_password_enc: string;
    updated_at: Date;
    trial_started_at: Date | null;
  }>(
    `SELECT p.cpf, p.email, p.curso_id, p.sigaa_password_enc, p.updated_at,
            t.trial_started_at
     FROM app_profiles p
     LEFT JOIN trial_por_cpf t ON t.cpf = p.cpf
     WHERE (
       $1::text IS NULL
       OR lower(p.email) LIKE $1
       OR p.cpf LIKE $2
     )
     ORDER BY p.created_at DESC
     LIMIT 200`,
    [pattern, cpfPattern]
  );

  return result.rows.map((row) => ({
    cpf: normalizeCpf(row.cpf),
    cpfMasked: maskCpf(row.cpf),
    cpfLast4: cpfLast4(row.cpf),
    displayName: row.email.split("@")[0] || `CPF ${cpfLast4(row.cpf)}`,
    cursoId: row.curso_id,
    email: row.email,
    hasSigaaPassword: row.sigaa_password_enc.trim().length > 0,
    lastSyncAt: row.updated_at.toISOString(),
    subscription: resolvePostgresDevSubscription(row.trial_started_at),
  }));
}

function listSqliteAccounts(query?: string): DevAccountView[] {
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

  const accounts: DevAccountView[] = [];
  for (const cpf of cpfs) {
    const account = readSqliteAccount(cpf);
    if (!account) continue;
    if (
      matchesQuery({
        cpf,
        displayName: account.displayName,
        email: account.email,
        q: query ?? "",
      })
    ) {
      accounts.push(account);
    }
  }

  return accounts;
}

export async function listDevAccounts(query?: string): Promise<DevAccountView[]> {
  if (isPostgresBackend()) {
    return listPostgresAccounts(query);
  }

  return listSqliteAccounts(query);
}

export async function listDevTargetCpfs(input: {
  scope: "individual" | "global";
  cpf?: string;
  query?: string;
}): Promise<string[]> {
  if (input.scope === "individual") {
    const cpf = normalizeCpf(input.cpf ?? "");
    if (cpf.length < 11) {
      throw new Error("CPF inválido para escopo individual.");
    }
    return [cpf];
  }

  if (isPostgresBackend()) {
    const pool = getPostgresPool();
    const q = input.query?.trim().toLowerCase() ?? "";
    const cpfNeedle = q.replace(/\D/g, "");
    const result = await pool.query<{ cpf: string }>(
      `SELECT cpf FROM app_profiles
       WHERE length(trim(sigaa_password_enc)) > 0
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
      return account?.hasSigaaPassword;
    });
}
