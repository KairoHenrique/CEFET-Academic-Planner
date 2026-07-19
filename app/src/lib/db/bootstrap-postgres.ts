import { getPostgresPool } from "@/lib/db/postgres/pool";
import { seedAllPpcGlobalToPostgres } from "@/lib/db/postgres/seed-ppc-global";
import { APP_CURSO_IDS } from "@/lib/auth/account/curso-catalog";

/** Evita rechecar/seeds caros em toda request do withDb (DoS/perf). */
let multiPpcSeedReady = false;
let multiPpcSeedInflight: Promise<void> | null = null;

export async function ensurePostgresReady(): Promise<void> {
  const pool = getPostgresPool();
  await pool.query("SELECT 1");

  const requiredMigrations = [
    "20260704120000_b39_initial_schema.sql",
    "20260704130000_b44_app_accounts.sql",
    "20260704140000_b58_trial_por_cpf.sql",
    "20260704150000_b62_account_email_queue.sql",
    "20260705180000_b40_rls_multi_tenant.sql",
    "20260705210000_b68d_sync_policy_app_config.sql",
    "20260705220000_b49_billing_tables.sql",
    "20260705220100_b49_billing_rls.sql",
    "20260705230000_b69_plan_gift_keys.sql",
    "20260705230100_b69_plan_gift_keys_rls.sql",
    "20260717120000_b74_account_referrals.sql",
    "20260717120100_b74_account_referrals_rls.sql",
    "20260719120000_support_notify_email_kind.sql",
  ];

  const migration = await pool.query<{ filename: string }>(
    `SELECT filename FROM planner_schema_migrations
     WHERE filename = ANY($1::text[])`,
    [requiredMigrations]
  );

  if ((migration.rowCount ?? 0) < requiredMigrations.length) {
    throw new Error(
      "Schema Postgres incompleto. Rode: npm run db:migrate"
    );
  }

  await ensureMultiPpcSeedsIfMissing();
}

/**
 * Garante seed dos 3 PPCs no catálogo global.
 * Uma query agregada + lock em memória (sem N counts por request).
 */
async function ensureMultiPpcSeedsIfMissing(): Promise<void> {
  if (multiPpcSeedReady) return;
  if (multiPpcSeedInflight) {
    await multiPpcSeedInflight;
    return;
  }

  multiPpcSeedInflight = (async () => {
    const pool = getPostgresPool();
    const result = await pool.query<{ missing: number }>(
      `SELECT COUNT(*)::int AS missing
       FROM unnest($1::text[]) AS c(curso_id)
       WHERE NOT EXISTS (
         SELECT 1 FROM disciplinas d WHERE d.curso_id = c.curso_id LIMIT 1
       )`,
      [APP_CURSO_IDS as unknown as string[]]
    );

    const missing = Number(result.rows[0]?.missing ?? 0);
    if (missing > 0) {
      const results = await seedAllPpcGlobalToPostgres();
      console.info(
        "[bootstrap-pg] seed Multi-PPC:",
        results
          .map((r) => `${r.cursoId}=${r.disciplinas}d/${r.requisitos}r`)
          .join(" · ")
      );
    }

    multiPpcSeedReady = true;
  })();

  try {
    await multiPpcSeedInflight;
  } finally {
    multiPpcSeedInflight = null;
  }
}
