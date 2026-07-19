import { getPostgresPool } from "@/lib/db/postgres/pool";
import {
  countGlobalDisciplinas,
  seedAllPpcGlobalToPostgres,
} from "@/lib/db/postgres/seed-ppc-global";
import { APP_CURSO_IDS } from "@/lib/auth/account/curso-catalog";

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

/** Garante seed dos 3 PPCs no catálogo global (idempotente). */
async function ensureMultiPpcSeedsIfMissing(): Promise<void> {
  let needsSeed = false;
  for (const cursoId of APP_CURSO_IDS) {
    const count = await countGlobalDisciplinas(cursoId);
    if (count === 0) {
      needsSeed = true;
      break;
    }
  }
  if (!needsSeed) return;

  const results = await seedAllPpcGlobalToPostgres();
  console.info(
    "[bootstrap-pg] seed Multi-PPC:",
    results
      .map((r) => `${r.cursoId}=${r.disciplinas}d/${r.requisitos}r`)
      .join(" · ")
  );
}
