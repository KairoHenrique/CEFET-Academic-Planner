import { getPostgresPool } from "@/lib/db/postgres/pool";

export async function ensurePostgresReady(): Promise<void> {
  const pool = getPostgresPool();
  await pool.query("SELECT 1");

  const migration = await pool.query<{ filename: string }>(
    `SELECT filename FROM planner_schema_migrations
     WHERE filename = $1 LIMIT 1`,
    ["20260704120000_b39_initial_schema.sql"]
  );

  if (migration.rowCount === 0) {
    throw new Error(
      "Schema Postgres não aplicado. Rode: npm run db:migrate"
    );
  }
}
