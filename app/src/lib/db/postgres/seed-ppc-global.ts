import type pg from "pg";
import { resolveDefaultCursoId } from "@/lib/db/backend/config";
import { loadPpcSeedData } from "@/lib/db/ppc-seed-loader";
import { normalizeCefetCh } from "@/lib/disciplinas/cefet-ch";
import { resolvePpcEmenta } from "@/lib/disciplinas/resolve-ppc-ementa";
import { getPostgresPool } from "@/lib/db/postgres/pool";

export interface SeedPpcGlobalResult {
  cursoId: string;
  disciplinas: number;
  requisitos: number;
}

async function upsertDisciplina(
  client: pg.PoolClient,
  cursoId: string,
  item: ReturnType<typeof loadPpcSeedData>[number]
): Promise<void> {
  const { codigo, nome, periodo, tipo } = item.disciplina;
  const carga_horaria = normalizeCefetCh(item.disciplina.carga_horaria);
  const ementa = resolvePpcEmenta(codigo, nome, carga_horaria);

  await client.query(
    `
    INSERT INTO disciplinas (curso_id, codigo, nome, tipo, carga_horaria, periodo, ementa)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    ON CONFLICT (curso_id, codigo) DO UPDATE SET
      nome = EXCLUDED.nome,
      tipo = EXCLUDED.tipo,
      carga_horaria = EXCLUDED.carga_horaria,
      periodo = EXCLUDED.periodo,
      ementa = EXCLUDED.ementa
    `,
    [cursoId, codigo, nome, tipo, carga_horaria, periodo, ementa]
  );
}

async function replaceRequisitos(
  client: pg.PoolClient,
  cursoId: string,
  items: ReturnType<typeof loadPpcSeedData>
): Promise<number> {
  await client.query("DELETE FROM requisitos WHERE curso_id = $1", [cursoId]);

  let inserted = 0;
  for (const item of items) {
    for (const req of item.requisitos) {
      if (req.requisito_id === "-") continue;
      try {
        await client.query(
          `
          INSERT INTO requisitos (curso_id, disciplina_id, requisito_id, tipo)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (curso_id, disciplina_id, requisito_id) DO UPDATE SET
            tipo = EXCLUDED.tipo
          `,
          [cursoId, req.disciplina_id, req.requisito_id, req.tipo]
        );
        inserted += 1;
      } catch {
        // Requisito órfão no JSON — ignorado no seed.
      }
    }
  }
  return inserted;
}

export async function seedPpcGlobalToPostgres(
  cursoId = resolveDefaultCursoId()
): Promise<SeedPpcGlobalResult> {
  const pool = getPostgresPool();
  const items = loadPpcSeedData();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    for (const item of items) {
      await upsertDisciplina(client, cursoId, item);
    }
    const requisitos = await replaceRequisitos(client, cursoId, items);
    await client.query("COMMIT");
    return { cursoId, disciplinas: items.length, requisitos };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function countGlobalDisciplinas(
  cursoId = resolveDefaultCursoId()
): Promise<number> {
  const pool = getPostgresPool();
  const result = await pool.query<{ total: string }>(
    "SELECT COUNT(*)::text AS total FROM disciplinas WHERE curso_id = $1",
    [cursoId]
  );
  return Number(result.rows[0]?.total ?? 0);
}
