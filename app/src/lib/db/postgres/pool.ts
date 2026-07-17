import pg from "pg";
import {
  isCloudDeployment,
  isPostgresBackend,
} from "@/lib/db/backend/config";

let pool: pg.Pool | null = null;

function loadDatabaseUrl(): string {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error("DATABASE_URL ausente para backend postgres.");
  }
  return url;
}

/**
 * No Cloudflare Workers, um socket TCP aberto em uma requisição NÃO pode ser
 * reutilizado na seguinte — o `pg.Pool` global entregaria uma conexão morta e a
 * query ficaria pendurada até o runtime cancelar o Worker (login/cadastro 500).
 *
 * Por isso, no deploy cloud cada operação abre uma conexão curta e a fecha
 * (via Session pooler / pgbouncer do Supabase). Fora do cloud (dev local, worker
 * no PC — processo longevo) o pool tradicional é reutilizado normalmente.
 */
class CloudRequestPool {
  private buildClient(): pg.Client {
    return new pg.Client({
      connectionString: loadDatabaseUrl(),
      connectionTimeoutMillis: 10_000,
    });
  }

  async query<R extends pg.QueryResultRow = pg.QueryResultRow>(
    text: string,
    params?: unknown[]
  ): Promise<pg.QueryResult<R>> {
    const client = this.buildClient();
    await client.connect();
    try {
      return await client.query<R>(text, params as unknown[] | undefined);
    } finally {
      await client.end().catch(() => undefined);
    }
  }

  async connect(): Promise<pg.PoolClient> {
    const client = this.buildClient();
    await client.connect();
    const releasable = client as unknown as pg.PoolClient;
    releasable.release = () => {
      void client.end().catch(() => undefined);
    };
    return releasable;
  }

  async end(): Promise<void> {
    // Sem estado persistente: nada a fechar.
  }
}

function createStandardPool(): pg.Pool {
  return new pg.Pool({
    connectionString: loadDatabaseUrl(),
    max: 5,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });
}

export function getPostgresPool(): pg.Pool {
  if (!isPostgresBackend()) {
    throw new Error("getPostgresPool() chamado fora do backend postgres.");
  }

  if (isCloudDeployment()) {
    // Stateless: seguro criar por chamada (sem socket carregado entre requests).
    return new CloudRequestPool() as unknown as pg.Pool;
  }

  if (!pool) {
    pool = createStandardPool();
  }

  return pool;
}

export async function closePostgresPool(): Promise<void> {
  if (!pool) return;
  await pool.end();
  pool = null;
}
