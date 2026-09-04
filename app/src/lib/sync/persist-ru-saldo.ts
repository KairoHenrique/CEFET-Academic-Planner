import { getAluno, updateAlunoRuSaldo } from "@/lib/db/queries";
import { isPostgresBackend } from "@/lib/db/backend/config";
import { getPostgresPool } from "@/lib/db/postgres/pool";
import {
  getMirrorPool,
  isSyncMirrorEnabled,
} from "@/lib/sync-mirror/mirror-config";
import type pg from "pg";

function resolveRuPersistPool(): pg.Pool | null {
  if (isPostgresBackend()) return getPostgresPool();
  if (isSyncMirrorEnabled()) return getMirrorPool();
  return null;
}

/**
 * Grava saldo do RU no staging SQLite (se houver aluno) e no Postgres
 * (backend cloud ou mirror do worker PC).
 */
export async function persistRuSaldo(input: {
  refeicoesDisponiveis: number;
  /** CPF / username SIGAA — resolve user_id no Postgres. */
  username: string;
  syncedAt?: string;
}): Promise<void> {
  const syncedAt = input.syncedAt ?? new Date().toISOString();
  const refeicoes = Math.max(0, Math.floor(input.refeicoesDisponiveis));

  try {
    const aluno = getAluno();
    if (aluno) {
      updateAlunoRuSaldo(refeicoes, syncedAt);
    }
  } catch {
    /* SQLite pode estar indisponível no caminho cloud-only */
  }

  const pool = resolveRuPersistPool();
  if (!pool) return;

  const profile = await pool.query<{ user_id: string }>(
    `SELECT user_id FROM app_profiles WHERE cpf = $1 LIMIT 1`,
    [input.username.trim()]
  );
  const userId = profile.rows[0]?.user_id;
  if (!userId) return;

  await pool.query(
    `UPDATE aluno
     SET refeicoes_disponiveis = $2,
         ru_synced_at = $3::timestamptz
     WHERE user_id = $1`,
    [userId, refeicoes, syncedAt]
  );
}
