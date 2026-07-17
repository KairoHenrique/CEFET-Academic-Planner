import fs from "node:fs";
import path from "node:path";
import { normalizeCpf } from "@/lib/auth/account/cpf";
import { isPostgresBackend } from "@/lib/db/backend/config";
import { ensureDbReady } from "@/lib/db/bootstrap";
import { getPostgresPool } from "@/lib/db/postgres/pool";
import { getAluno } from "@/lib/db/queries";
import { resolveDbPathForUser, runWithUserDb } from "@/lib/db/connection-manager";
import { resolveDevAccountRef } from "@/lib/dev-panel/dev-account-ref";
import type { DevRobotScope } from "@/lib/dev-panel/types";

/** Teto defensivo de destinatários por campanha (evita disparo acidental massivo). */
const MAX_TARGETS = 5000;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface PromotionTarget {
  userId: string | null;
  cpf: string;
  email: string;
  fullName: string | null;
}

interface ResolvedScope {
  scope: DevRobotScope;
  /** CPF já resolvido quando `scope === "individual"`. */
  cpf: string | null;
}

interface PromotionScopeInput {
  scope: DevRobotScope;
  accountRef?: string;
}

function isValidEmail(email: string | null | undefined): email is string {
  return typeof email === "string" && EMAIL_PATTERN.test(email.trim());
}

interface PostgresTargetRow {
  user_id: string;
  cpf: string;
  email: string;
  aluno_nome: string | null;
}

async function resolvePostgresTargets(
  scope: ResolvedScope
): Promise<PromotionTarget[]> {
  const pool = getPostgresPool();
  const baseSelect = `SELECT p.user_id, p.cpf, p.email, a.nome AS aluno_nome
     FROM app_profiles p
     LEFT JOIN LATERAL (
       SELECT nome FROM aluno WHERE aluno.user_id = p.user_id LIMIT 1
     ) a ON true
     WHERE p.email IS NOT NULL AND length(trim(p.email)) > 0`;

  const result =
    scope.scope === "individual"
      ? await pool.query<PostgresTargetRow>(
          `${baseSelect} AND p.cpf = $1 LIMIT 1`,
          [scope.cpf]
        )
      : await pool.query<PostgresTargetRow>(
          `${baseSelect} ORDER BY p.created_at DESC LIMIT ${MAX_TARGETS}`
        );

  return result.rows
    .filter((row) => isValidEmail(row.email))
    .map((row) => ({
      userId: row.user_id,
      cpf: normalizeCpf(row.cpf),
      email: row.email.trim(),
      fullName: row.aluno_nome?.trim() || null,
    }));
}

function readSqliteTarget(cpf: string): PromotionTarget | null {
  const dbPath = resolveDbPathForUser(cpf);
  if (!fs.existsSync(dbPath)) {
    return null;
  }

  return runWithUserDb(cpf, () => {
    ensureDbReady();
    const aluno = getAluno();
    const email = aluno?.email?.trim();
    if (!isValidEmail(email)) {
      return null;
    }

    return {
      userId: null,
      cpf: normalizeCpf(cpf),
      email,
      fullName: aluno?.nome?.trim() || null,
    };
  });
}

function resolveSqliteTargets(scope: ResolvedScope): PromotionTarget[] {
  if (scope.scope === "individual") {
    const target = scope.cpf ? readSqliteTarget(scope.cpf) : null;
    return target ? [target] : [];
  }

  const root = path.join(
    process.env.PLANNER_DATA_ROOT?.trim() || path.join(process.cwd(), ".data"),
    "users"
  );

  if (!fs.existsSync(root)) {
    return [];
  }

  const targets: PromotionTarget[] = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const target = readSqliteTarget(entry.name);
    if (target) targets.push(target);
    if (targets.length >= MAX_TARGETS) break;
  }

  return targets;
}

export async function resolvePromotionTargets(
  input: PromotionScopeInput
): Promise<PromotionTarget[]> {
  const cpf =
    input.scope === "individual"
      ? normalizeCpf(await resolveDevAccountRef(input.accountRef ?? ""))
      : null;

  const scope: ResolvedScope = { scope: input.scope, cpf };

  if (isPostgresBackend()) {
    return resolvePostgresTargets(scope);
  }
  return resolveSqliteTargets(scope);
}
