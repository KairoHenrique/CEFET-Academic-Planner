/**
 * Revoga tempo de plano de TODOS os usuarios (ops one-shot).
 *
 * Uso:
 *   npx tsx --env-file=.env.local scripts/revoke-all-subscriptions.ts
 */
import { Client } from "pg";

async function main(): Promise<void> {
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) {
    throw new Error("DATABASE_URL ausente. Rode com --env-file=.env.local.");
  }

  const client = new Client({ connectionString, connectionTimeoutMillis: 15_000 });
  await client.connect();

  try {
    const before = await client.query<{ status: string; count: string }>(
      `SELECT status, count(*)::text AS count
       FROM subscriptions
       WHERE status IN ('active', 'trial_active')
       GROUP BY status
       ORDER BY status`
    );

    console.log("Antes (ativas / trial_active):");
    if (before.rows.length === 0) {
      console.log("  (nenhuma)");
    } else {
      for (const row of before.rows) {
        console.log(`  ${row.status}: ${row.count}`);
      }
    }

    await client.query("BEGIN");

    const updated = await client.query<{ id: string }>(
      `UPDATE subscriptions
       SET status = 'expired',
           expires_at = now() - interval '90 days',
           updated_at = now()
       WHERE status IN ('active', 'trial_active')
       RETURNING id`
    );

    await client.query("COMMIT");

    console.log(`Revogadas: ${updated.rowCount ?? 0} assinatura(s).`);
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    await client.end().catch(() => undefined);
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Falha ao revogar assinaturas: ${message}`);
  process.exit(1);
});
