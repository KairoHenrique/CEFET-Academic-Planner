import { createHmac } from "node:crypto";
import { normalizeCpf } from "@/lib/auth/account/cpf";
import { findCpfByUserId } from "@/lib/auth/account/profile-repository";
import { isPostgresBackend } from "@/lib/db/backend/config";
import fs from "node:fs";
import path from "node:path";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function resolveRefSecret(): string {
  const fromEnv =
    process.env.CREDENTIALS_ENCRYPTION_KEY?.trim() ||
    process.env.PLANNER_DEV_SESSION_SECRET?.trim();

  if (!fromEnv) {
    throw new Error("Segredo para accountRef do painel dev não configurado.");
  }

  return fromEnv;
}

export function isUuidAccountRef(value: string): boolean {
  return UUID_PATTERN.test(value);
}

export function buildDevAccountRef(input: {
  userId?: string | null;
  cpf: string;
}): string {
  if (input.userId) {
    return input.userId;
  }

  const cpf = normalizeCpf(input.cpf);
  return createHmac("sha256", resolveRefSecret())
    .update(`dev-account:${cpf}`)
    .digest("base64url");
}

export async function resolveDevAccountRef(accountRef: string): Promise<string> {
  const trimmed = accountRef.trim();
  if (!trimmed) {
    throw new Error("accountRef ausente.");
  }

  if (isPostgresBackend() && isUuidAccountRef(trimmed)) {
    const cpf = await findCpfByUserId(trimmed);
    if (cpf) {
      return cpf;
    }
  }

  const root = path.join(
    process.env.PLANNER_DATA_ROOT?.trim() || path.join(process.cwd(), ".data"),
    "users"
  );

  if (!fs.existsSync(root)) {
    throw new Error("Conta não encontrada para accountRef informado.");
  }

  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const cpf = normalizeCpf(entry.name);
    if (buildDevAccountRef({ cpf }) === trimmed) {
      return cpf;
    }
  }

  throw new Error("Conta não encontrada para accountRef informado.");
}
