import type pg from "pg";
import { normalizeSigaaUsername } from "@/lib/db/connection-manager";

export interface MirrorTenant {
  userId: string;
  cursoId: string;
}

/**
 * Resolve o tenant do mirror: CPF (login SIGAA) → conta do app.
 * Sem conta cadastrada não há user_id — o mirror por usuário é abortado
 * (o catálogo global ainda pode ser espelhado).
 */
export async function resolveMirrorTenantByCpf(
  pool: pg.Pool,
  username: string
): Promise<MirrorTenant | null> {
  const cpf = normalizeSigaaUsername(username);
  if (!/^\d{11}$/.test(cpf)) {
    return null;
  }

  const result = await pool.query(
    "SELECT user_id, curso_id FROM app_profiles WHERE cpf = $1 LIMIT 1",
    [cpf]
  );
  const row = result.rows[0] as
    | { user_id: string; curso_id: string }
    | undefined;

  if (!row?.user_id) {
    return null;
  }

  return { userId: row.user_id, cursoId: row.curso_id || "eng-computacao" };
}
