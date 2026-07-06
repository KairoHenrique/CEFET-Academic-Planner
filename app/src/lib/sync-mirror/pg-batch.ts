import type pg from "pg";

type SqlValue = string | number | null;

const INSERT_CHUNK_SIZE = 200;

/**
 * INSERT multi-linha parametrizado (chunked) — evita round-trip por linha.
 * `conflictClause` opcional (ex.: `ON CONFLICT (x) DO NOTHING`).
 */
export async function batchInsert(
  client: pg.PoolClient,
  table: string,
  columns: string[],
  rows: SqlValue[][],
  conflictClause = ""
): Promise<number> {
  let inserted = 0;

  for (let offset = 0; offset < rows.length; offset += INSERT_CHUNK_SIZE) {
    const chunk = rows.slice(offset, offset + INSERT_CHUNK_SIZE);
    const params: SqlValue[] = [];
    const tuples = chunk.map((row) => {
      const placeholders = row.map((value) => {
        params.push(value);
        return `$${params.length}`;
      });
      return `(${placeholders.join(", ")})`;
    });

    const result = await client.query(
      `INSERT INTO ${table} (${columns.join(", ")})
       VALUES ${tuples.join(", ")}
       ${conflictClause}`,
      params
    );
    inserted += result.rowCount ?? 0;
  }

  return inserted;
}
