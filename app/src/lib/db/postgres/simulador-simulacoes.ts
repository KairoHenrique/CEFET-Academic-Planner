import { resolveQueryCursoId } from "@/lib/db/resolve-query-curso-id";
import { getPostgresPool } from "@/lib/db/postgres/pool";
import { getActiveTenantUserId } from "@/lib/db/postgres/tenant-context";
import type { SimuladorSimulacaoRow } from "@/lib/db/queries";

function mapRow(row: Record<string, unknown>): SimuladorSimulacaoRow {
  return {
    id: String(row.id),
    titulo: String(row.titulo),
    semestre: String(row.semestre),
    payload_json:
      typeof row.payload_json === "string"
        ? row.payload_json
        : JSON.stringify(row.payload_json),
    created_at:
      row.created_at instanceof Date
        ? row.created_at.toISOString()
        : String(row.created_at),
    updated_at:
      row.updated_at instanceof Date
        ? row.updated_at.toISOString()
        : String(row.updated_at),
  };
}

function requireTenantUserId(): string {
  const userId = getActiveTenantUserId();
  if (!userId) {
    throw new Error("Tenant user ausente para simulador_simulacoes.");
  }
  return userId;
}

export async function pgListSimuladorSimulacoes(): Promise<SimuladorSimulacaoRow[]> {
  const result = await getPostgresPool().query(
    `SELECT id, titulo, semestre, payload_json, created_at, updated_at
     FROM simulador_simulacoes
     WHERE user_id = $1 AND curso_id = $2
     ORDER BY updated_at DESC`,
    [requireTenantUserId(), resolveQueryCursoId()]
  );
  return result.rows.map((row) => mapRow(row));
}

export async function pgGetSimuladorSimulacaoById(
  id: string
): Promise<SimuladorSimulacaoRow | undefined> {
  const result = await getPostgresPool().query(
    `SELECT id, titulo, semestre, payload_json, created_at, updated_at
     FROM simulador_simulacoes
     WHERE user_id = $1 AND curso_id = $2 AND id = $3
     LIMIT 1`,
    [requireTenantUserId(), resolveQueryCursoId(), id]
  );
  const row = result.rows[0];
  return row ? mapRow(row) : undefined;
}

export async function pgInsertSimuladorSimulacao(
  row: SimuladorSimulacaoRow
): Promise<void> {
  await getPostgresPool().query(
    `INSERT INTO simulador_simulacoes (
      id, user_id, curso_id, titulo, semestre, payload_json, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::timestamptz, $8::timestamptz)`,
    [
      row.id,
      requireTenantUserId(),
      resolveQueryCursoId(),
      row.titulo,
      row.semestre,
      row.payload_json,
      row.created_at,
      row.updated_at,
    ]
  );
}

export async function pgDeleteSimuladorSimulacao(id: string): Promise<boolean> {
  const result = await getPostgresPool().query(
    `DELETE FROM simulador_simulacoes
     WHERE user_id = $1 AND curso_id = $2 AND id = $3`,
    [requireTenantUserId(), resolveQueryCursoId(), id]
  );
  return (result.rowCount ?? 0) > 0;
}
