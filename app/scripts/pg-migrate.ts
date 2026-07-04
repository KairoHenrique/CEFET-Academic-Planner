import { readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import pg from "pg";

const MIGRATIONS_DIR = resolve(__dirname, "../../supabase/migrations");

function loadDatabaseUrl(): string {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error(
      "DATABASE_URL ausente. Defina em app/.env.local ou exporte no shell."
    );
  }
  return url;
}

function listMigrationFiles(): string[] {
  return readdirSync(MIGRATIONS_DIR)
    .filter((name) => name.endsWith(".sql"))
    .sort();
}

async function ensureMigrationsTable(client: pg.Client): Promise<void> {
  await client.query(`
    CREATE TABLE IF NOT EXISTS planner_schema_migrations (
      id BIGSERIAL PRIMARY KEY,
      filename TEXT NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
}

async function appliedFilenames(client: pg.Client): Promise<Set<string>> {
  const result = await client.query<{ filename: string }>(
    "SELECT filename FROM planner_schema_migrations ORDER BY id"
  );
  return new Set(result.rows.map((row) => row.filename));
}

async function applyMigration(
  client: pg.Client,
  filename: string
): Promise<void> {
  const sql = readFileSync(join(MIGRATIONS_DIR, filename), "utf8");
  await client.query("BEGIN");
  try {
    await client.query(sql);
    await client.query(
      "INSERT INTO planner_schema_migrations (filename) VALUES ($1)",
      [filename]
    );
    await client.query("COMMIT");
    console.log(`applied: ${filename}`);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}

async function main(): Promise<void> {
  const files = listMigrationFiles();
  if (files.length === 0) {
    console.log("Nenhuma migration em supabase/migrations/");
    return;
  }

  const client = new pg.Client({ connectionString: loadDatabaseUrl() });
  await client.connect();

  try {
    await ensureMigrationsTable(client);
    const done = await appliedFilenames(client);

    for (const filename of files) {
      if (done.has(filename)) {
        console.log(`skip: ${filename}`);
        continue;
      }
      await applyMigration(client, filename);
    }
  } finally {
    await client.end();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
