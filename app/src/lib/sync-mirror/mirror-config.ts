import pg from "pg";

/**
 * Mirror sync → Postgres (B72).
 *
 * O pipeline do scraper continua gravando no SQLite (staging, regras de
 * negócio intactas); após sucesso, o snapshot é replicado ao Postgres
 * (serving DB da cloud) de forma idempotente.
 *
 * Opt-in explícito: exige `DATABASE_URL` + `SYNC_MIRROR_POSTGRES=true|1`.
 * Pool próprio — independente de `PLANNER_DATABASE` (o processo do
 * worker/dev roda em modo sqlite e ainda assim espelha para o Postgres).
 */

let mirrorPool: pg.Pool | null = null;

export function isSyncMirrorEnabled(): boolean {
  const flag = process.env.SYNC_MIRROR_POSTGRES?.trim().toLowerCase();
  const enabled = flag === "true" || flag === "1";
  return enabled && Boolean(process.env.DATABASE_URL?.trim());
}

export function getMirrorPool(): pg.Pool {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error("DATABASE_URL ausente para o mirror sync→Postgres.");
  }

  if (!mirrorPool) {
    mirrorPool = new pg.Pool({
      connectionString: url,
      max: 2,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 15_000,
    });
  }

  return mirrorPool;
}

export async function closeMirrorPool(): Promise<void> {
  if (!mirrorPool) return;
  await mirrorPool.end();
  mirrorPool = null;
}
