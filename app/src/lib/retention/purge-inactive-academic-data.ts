import { getPostgresPool } from "@/lib/db/postgres/pool";
import { TENANT_DATA_TABLES } from "@/lib/sync-policy/schema-catalog";

export interface InactiveFreeCandidate {
  userId: string;
  cpf: string;
  lastSeenAt: string;
}

export interface PurgeResult {
  userId: string;
  cpfMasked: string;
  deletedRows: number;
}

function maskCpf(cpf: string): string {
  const d = cpf.replace(/\D/g, "");
  if (d.length < 4) return "***";
  return `***${d.slice(-4)}`;
}

/**
 * Free (sem plano ads_free ativo) com last_seen_at > 15 dias.
 * Premium ativo nunca entra.
 */
export async function listInactiveFreeForPurge(
  limit = 50
): Promise<InactiveFreeCandidate[]> {
  const pool = getPostgresPool();
  const capped = Math.min(Math.max(limit, 1), 200);
  const result = await pool.query<{
    user_id: string;
    cpf: string;
    last_seen_at: Date;
  }>(
    `SELECT p.user_id, p.cpf, p.last_seen_at
     FROM app_profiles p
     WHERE p.last_seen_at IS NOT NULL
       AND p.last_seen_at < now() - interval '15 days'
       AND (
         p.academic_purged_at IS NULL
         OR p.academic_purged_at < p.last_seen_at
       )
       AND NOT EXISTS (
         SELECT 1 FROM subscriptions s
         WHERE s.user_id = p.user_id
           AND s.status = 'active'
           AND s.expires_at > now()
       )
     ORDER BY p.last_seen_at ASC
     LIMIT $1`,
    [capped]
  );

  return result.rows.map((row) => ({
    userId: row.user_id,
    cpf: row.cpf,
    lastSeenAt: row.last_seen_at.toISOString(),
  }));
}

/**
 * Apaga dados academicos/manuais do tenant; mantem app_profiles + auth + billing.
 */
export async function purgeAcademicDataForUser(
  userId: string
): Promise<PurgeResult> {
  const pool = getPostgresPool();
  const profile = await pool.query<{ cpf: string }>(
    `SELECT cpf FROM app_profiles WHERE user_id = $1 LIMIT 1`,
    [userId]
  );
  const cpf = profile.rows[0]?.cpf ?? "";

  const client = await pool.connect();
  let deletedRows = 0;
  try {
    await client.query("BEGIN");

    // Tabelas tenant padrao
    for (const table of TENANT_DATA_TABLES) {
      const res = await client.query(
        `DELETE FROM ${table} WHERE user_id = $1`,
        [userId]
      );
      deletedRows += res.rowCount ?? 0;
    }

    // Extras de produto
    for (const table of [
      "simulador_simulacoes",
      "push_device_tokens",
      "task_submissions",
    ] as const) {
      try {
        const res = await client.query(
          `DELETE FROM ${table} WHERE user_id = $1`,
          [userId]
        );
        deletedRows += res.rowCount ?? 0;
      } catch {
        /* tabela pode nao existir em ambientes antigos */
      }
    }

    await client.query(
      `UPDATE app_profiles
       SET academic_purged_at = now(), updated_at = now()
       WHERE user_id = $1`,
      [userId]
    );

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  return {
    userId,
    cpfMasked: maskCpf(cpf),
    deletedRows,
  };
}

export async function runInactiveAcademicPurgeCron(options?: {
  limit?: number;
  dryRun?: boolean;
}): Promise<{
  candidates: number;
  purged: number;
  dryRun: boolean;
  results: PurgeResult[];
}> {
  const candidates = await listInactiveFreeForPurge(options?.limit ?? 50);
  if (options?.dryRun) {
    return {
      candidates: candidates.length,
      purged: 0,
      dryRun: true,
      results: candidates.map((c) => ({
        userId: c.userId,
        cpfMasked: maskCpf(c.cpf),
        deletedRows: 0,
      })),
    };
  }

  const results: PurgeResult[] = [];
  for (const candidate of candidates) {
    results.push(await purgeAcademicDataForUser(candidate.userId));
  }

  return {
    candidates: candidates.length,
    purged: results.length,
    dryRun: false,
    results,
  };
}
