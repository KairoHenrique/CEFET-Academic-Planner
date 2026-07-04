import pg from "pg";
import { isPostgresBackend } from "@/lib/db/backend/config";

let pool: pg.Pool | null = null;

function loadDatabaseUrl(): string {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error("DATABASE_URL ausente para backend postgres.");
  }
  return url;
}

export function getPostgresPool(): pg.Pool {
  if (!isPostgresBackend()) {
    throw new Error("getPostgresPool() chamado fora do backend postgres.");
  }

  if (!pool) {
    pool = new pg.Pool({
      connectionString: loadDatabaseUrl(),
      max: 5,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
    });
  }

  return pool;
}

export async function closePostgresPool(): Promise<void> {
  if (!pool) return;
  await pool.end();
  pool = null;
}
