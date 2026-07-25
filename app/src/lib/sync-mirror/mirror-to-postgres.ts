import { getMirrorPool, isSyncMirrorEnabled } from "./mirror-config";
import { mirrorUserTables } from "./mirror-user-tables";
import { batchInsert } from "./pg-batch";
import {
  readGlobalSqliteSnapshot,
  readUserSqliteSnapshot,
  type GlobalSqliteSnapshot,
} from "./read-sqlite-snapshot";
import { resolveMirrorTenantByCpf } from "./resolve-mirror-tenant";

export interface MirrorResult {
  ok: boolean;
  skipped: boolean;
  userMirrored: boolean;
  globalMirrored: boolean;
  message: string;
}

function skippedResult(message: string): MirrorResult {
  return {
    ok: true,
    skipped: true,
    userMirrored: false,
    globalMirrored: false,
    message,
  };
}

async function mirrorGlobalTables(
  snapshot: GlobalSqliteSnapshot,
  fallbackCursoId = "eng-computacao"
): Promise<void> {
  const pool = getMirrorPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    if (snapshot.calendario.length > 0) {
      await client.query("DELETE FROM calendario_academico");
      await batchInsert(
        client,
        "calendario_academico",
        ["evento", "data_inicio", "data_fim", "semestre"],
        snapshot.calendario.map((row) => [
          row.evento,
          row.data_inicio,
          row.data_fim,
          row.semestre,
        ])
      );
    }

    const semestres = [
      ...new Set(snapshot.turmasOfertadas.map((turma) => turma.semestre)),
    ];
    for (const semestre of semestres) {
      await client.query("DELETE FROM turmas_ofertadas WHERE semestre = $1 AND curso_id = $2", [
        semestre,
        fallbackCursoId
      ]);
    }
    if (snapshot.turmasOfertadas.length > 0) {
      await batchInsert(
        client,
        "turmas_ofertadas",
        [
          "turma_sigaa_id", "sigaa_componente", "codigo_disciplina", "nome",
          "turma_codigo", "semestre", "codigo_horario", "horario_exibicao",
          "local", "professor", "vagas", "vagas_ocupadas", "carga_horaria",
          "situacao", "tipo_turma", "departamento", "horario_indefinido",
          "categoria", "curso_id", "synced_at",
        ],
        snapshot.turmasOfertadas.map((turma) => [
          turma.turma_sigaa_id, turma.sigaa_componente, turma.codigo_disciplina,
          turma.nome, turma.turma_codigo, turma.semestre, turma.codigo_horario,
          turma.horario_exibicao, turma.local, turma.professor, turma.vagas,
          turma.vagas_ocupadas, turma.carga_horaria, turma.situacao,
          turma.tipo_turma, turma.departamento, turma.horario_indefinido,
          turma.categoria, turma.curso_id ?? fallbackCursoId, turma.synced_at,
        ]),
        `ON CONFLICT (curso_id, turma_sigaa_id) DO UPDATE SET
           vagas_ocupadas = EXCLUDED.vagas_ocupadas,
           synced_at = EXCLUDED.synced_at`
      );
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Espelha o staging SQLite do usuário no Postgres (serving DB da cloud).
 *
 * - Tabelas por usuário: transação única, tenant CPF→`app_profiles`,
 *   preservando edições cloud (`manual`/`override`).
 * - Catálogo global (calendário, turmas ofertadas): substituição idempotente.
 *
 * Falha aqui **não** derruba o sync — o chamador loga e marca partial.
 */
export async function mirrorSyncToPostgres(
  username: string
): Promise<MirrorResult> {
  if (!isSyncMirrorEnabled()) {
    return skippedResult("Mirror Postgres desligado (SYNC_MIRROR_POSTGRES).");
  }

  const userSnapshot = readUserSqliteSnapshot(username);
  const globalSnapshot = readGlobalSqliteSnapshot(username);
  if (!userSnapshot || !globalSnapshot) {
    return skippedResult("Staging SQLite do usuário não encontrado.");
  }

  const pool = getMirrorPool();
  const tenant = await resolveMirrorTenantByCpf(pool, username);

  let userMirrored = false;
  if (tenant) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await mirrorUserTables(client, tenant, userSnapshot);
      await client.query("COMMIT");
      userMirrored = true;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  await mirrorGlobalTables(
    globalSnapshot,
    tenant?.cursoId ?? "eng-computacao"
  );

  const message = tenant
    ? `Mirror Postgres ok (user ${tenant.userId.slice(0, 8)}… + catálogo global).`
    : "Mirror Postgres: catálogo global ok; conta do app não encontrada para o CPF — dados por usuário não espelhados.";

  console.info(`[mirror] ${message}`);

  return {
    ok: true,
    skipped: false,
    userMirrored,
    globalMirrored: true,
    message,
  };
}
