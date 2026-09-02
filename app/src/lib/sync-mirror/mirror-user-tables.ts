import type pg from "pg";
import { mergeSemestreUserPreferences } from "@/lib/sync/user-data-priority";
import type { SemestreAtualRow } from "@/lib/types/db";
import { batchInsert } from "./pg-batch";
import type { MirrorTenant } from "./resolve-mirror-tenant";
import type { UserSqliteSnapshot } from "./read-sqlite-snapshot";

/**
 * Replica as tabelas por usuário do staging SQLite ao Postgres.
 *
 * Regra #1 do produto preservada na fronteira: linhas do Postgres com
 * `manual = 1` ou `*_override = 1` (edições feitas na cloud) nunca são
 * apagadas nem sobrescritas pelo snapshot do scraper.
 */

function naturalKey(...parts: Array<string | null | undefined>): string {
  return parts.map((part) => (part ?? "").toLowerCase()).join("\0");
}

async function upsertDisciplinasCatalog(
  client: pg.PoolClient,
  tenant: MirrorTenant,
  snapshot: UserSqliteSnapshot
): Promise<void> {
  for (const disciplina of snapshot.disciplinas) {
    await client.query(
      `INSERT INTO disciplinas (curso_id, codigo, nome, tipo, carga_horaria, periodo, ementa)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (curso_id, codigo) DO UPDATE SET
         nome = EXCLUDED.nome,
         tipo = COALESCE(EXCLUDED.tipo, disciplinas.tipo),
         carga_horaria = COALESCE(EXCLUDED.carga_horaria, disciplinas.carga_horaria),
         periodo = COALESCE(EXCLUDED.periodo, disciplinas.periodo),
         ementa = COALESCE(EXCLUDED.ementa, disciplinas.ementa)`,
      [
        tenant.cursoId,
        disciplina.codigo,
        disciplina.nome,
        disciplina.tipo,
        disciplina.carga_horaria,
        disciplina.periodo,
        disciplina.ementa,
      ]
    );
  }

  const requisitoRows = snapshot.requisitos.map((req) => [
    tenant.cursoId,
    req.disciplina_id,
    req.requisito_id,
    req.tipo,
  ]);
  if (requisitoRows.length > 0) {
    await batchInsert(
      client,
      "requisitos",
      ["curso_id", "disciplina_id", "requisito_id", "tipo"],
      requisitoRows,
      "ON CONFLICT (curso_id, disciplina_id, requisito_id) DO NOTHING"
    );
  }
}

async function mirrorAluno(
  client: pg.PoolClient,
  tenant: MirrorTenant,
  snapshot: UserSqliteSnapshot
): Promise<void> {
  await client.query("DELETE FROM aluno WHERE user_id = $1", [tenant.userId]);
  if (!snapshot.aluno) return;

  await client.query(
    `INSERT INTO aluno (
       user_id, matricula, nome, curso, email, semestre_entrada, rg, status,
       refeicoes_disponiveis, ru_synced_at
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
    [
      tenant.userId,
      snapshot.aluno.matricula,
      snapshot.aluno.nome,
      snapshot.aluno.curso,
      snapshot.aluno.email,
      snapshot.aluno.semestre_entrada,
      snapshot.aluno.rg,
      snapshot.aluno.status,
      snapshot.aluno.refeicoes_disponiveis ?? null,
      snapshot.aluno.ru_synced_at ?? null,
    ]
  );
}

async function mirrorHistorico(
  client: pg.PoolClient,
  tenant: MirrorTenant,
  snapshot: UserSqliteSnapshot
): Promise<void> {
  await client.query("DELETE FROM historico WHERE user_id = $1", [
    tenant.userId,
  ]);
  await batchInsert(
    client,
    "historico",
    ["user_id", "curso_id", "disciplina_id", "semestre", "status", "nota_final"],
    snapshot.historico.map((row) => [
      tenant.userId,
      tenant.cursoId,
      row.disciplina_id,
      row.semestre,
      row.status,
      row.nota_final,
    ])
  );
}

async function mirrorSemestreAtual(
  client: pg.PoolClient,
  tenant: MirrorTenant,
  snapshot: UserSqliteSnapshot
): Promise<void> {
  const existing = await client.query(
    "SELECT * FROM semestre_atual WHERE user_id = $1 AND curso_id = $2",
    [tenant.userId, tenant.cursoId]
  );
  const existingById = new Map<string, SemestreAtualRow>(
    existing.rows.map((row) => [
      String(row.disciplina_id).toLowerCase(),
      row as SemestreAtualRow,
    ])
  );

  await client.query(
    "DELETE FROM semestre_atual WHERE user_id = $1 AND curso_id = $2",
    [tenant.userId, tenant.cursoId]
  );

  const merged = snapshot.semestreAtual.map((row) =>
    mergeSemestreUserPreferences(
      row,
      existingById.get(row.disciplina_id.toLowerCase())
    )
  );

  await batchInsert(
    client,
    "semestre_atual",
    [
      "user_id", "curso_id", "disciplina_id", "local", "codigo_horario",
      "horario_traduzido", "cor", "apelido", "nome_exibicao", "local_exibicao",
      "horario_exibicao", "professor_exibicao", "horas_semanais_exibicao",
      "grupo_nome", "professor", "max_faltas", "nota_maxima", "nota_aprovacao",
      "arquivos_baixados", "pdf_auto_download", "turma_data_inicio", "turma_data_fim",
    ],
    merged.map((row) => [
      tenant.userId, tenant.cursoId, row.disciplina_id, row.local,
      row.codigo_horario, row.horario_traduzido, row.cor, row.apelido,
      row.nome_exibicao, row.local_exibicao, row.horario_exibicao,
      row.professor_exibicao, row.horas_semanais_exibicao, row.grupo_nome,
      row.professor, row.max_faltas, row.nota_maxima, row.nota_aprovacao,
      row.arquivos_baixados, row.pdf_auto_download, row.turma_data_inicio,
      row.turma_data_fim,
    ])
  );
}

async function mirrorNotas(
  client: pg.PoolClient,
  tenant: MirrorTenant,
  snapshot: UserSqliteSnapshot
): Promise<void> {
  const protectedRows = await client.query(
    `SELECT disciplina_id, avaliacao_nome FROM notas
     WHERE user_id = $1 AND curso_id = $2
       AND (manual = 1 OR COALESCE(nota_override, 0) = 1)`,
    [tenant.userId, tenant.cursoId]
  );
  const protectedKeys = new Set(
    protectedRows.rows.map((row) =>
      naturalKey(String(row.disciplina_id), String(row.avaliacao_nome))
    )
  );

  await client.query(
    `DELETE FROM notas
     WHERE user_id = $1 AND curso_id = $2
       AND manual = 0 AND COALESCE(nota_override, 0) = 0`,
    [tenant.userId, tenant.cursoId]
  );

  const rows = snapshot.notasSynced.filter(
    (nota) => !protectedKeys.has(naturalKey(nota.disciplina_id, nota.avaliacao_nome))
  );

  await batchInsert(
    client,
    "notas",
    [
      "user_id", "curso_id", "disciplina_id", "avaliacao_nome",
      "nota_maxima", "nota_obtida", "manual", "nota_override", "nota_extra",
    ],
    rows.map((nota) => [
      tenant.userId, tenant.cursoId, nota.disciplina_id, nota.avaliacao_nome,
      nota.nota_maxima, nota.nota_obtida, 0, 0, nota.nota_extra ?? 0,
    ])
  );
}

async function mirrorFaltas(
  client: pg.PoolClient,
  tenant: MirrorTenant,
  snapshot: UserSqliteSnapshot
): Promise<void> {
  const protectedRows = await client.query(
    `SELECT disciplina_id, data FROM faltas
     WHERE user_id = $1 AND curso_id = $2
       AND (COALESCE(manual, 0) = 1 OR COALESCE(status_override, 0) = 1)`,
    [tenant.userId, tenant.cursoId]
  );
  const protectedKeys = new Set(
    protectedRows.rows.map((row) =>
      naturalKey(String(row.disciplina_id), String(row.data))
    )
  );

  await client.query(
    `DELETE FROM faltas
     WHERE user_id = $1 AND curso_id = $2
       AND COALESCE(manual, 0) = 0 AND COALESCE(status_override, 0) = 0`,
    [tenant.userId, tenant.cursoId]
  );

  const rows = snapshot.faltasSynced.filter(
    (falta) => !protectedKeys.has(naturalKey(falta.disciplina_id, falta.data))
  );

  await batchInsert(
    client,
    "faltas",
    [
      "user_id", "curso_id", "disciplina_id", "data",
      "status", "manual", "status_override", "quantidade",
    ],
    rows.map((falta) => [
      tenant.userId, tenant.cursoId, falta.disciplina_id, falta.data,
      falta.status, 0, 0, falta.quantidade ?? 0,
    ])
  );
}

async function mirrorTarefas(
  client: pg.PoolClient,
  tenant: MirrorTenant,
  snapshot: UserSqliteSnapshot
): Promise<void> {
  const protectedRows = await client.query(
    `SELECT disciplina_id, titulo FROM tarefas
     WHERE user_id = $1 AND curso_id = $2
       AND (manual = 1 OR COALESCE(concluida_override, 0) = 1)`,
    [tenant.userId, tenant.cursoId]
  );
  const protectedKeys = new Set(
    protectedRows.rows.map((row) =>
      naturalKey(String(row.disciplina_id), String(row.titulo))
    )
  );

  await client.query(
    `DELETE FROM tarefas
     WHERE user_id = $1 AND curso_id = $2
       AND manual = 0 AND COALESCE(concluida_override, 0) = 0`,
    [tenant.userId, tenant.cursoId]
  );

  const rows = snapshot.tarefasSynced.filter(
    (tarefa) => !protectedKeys.has(naturalKey(tarefa.disciplina_id, tarefa.titulo))
  );

  await batchInsert(
    client,
    "tarefas",
    [
      "user_id", "curso_id", "disciplina_id", "titulo", "descricao",
      "data_inicio", "data_fim", "hora_fim", "tipo", "possui_nota",
      "concluida", "manual", "concluida_override", "instrucoes",
      "entregaveis", "pontuacao_maxima", "sigaa_link_id",
    ],
    rows.map((tarefa) => [
      tenant.userId, tenant.cursoId, tarefa.disciplina_id, tarefa.titulo,
      tarefa.descricao, tarefa.data_inicio, tarefa.data_fim,
      tarefa.hora_fim ?? "23:59", tarefa.tipo, tarefa.possui_nota,
      tarefa.concluida, 0, 0, tarefa.instrucoes, tarefa.entregaveis,
      tarefa.pontuacao_maxima, tarefa.sigaa_link_id ?? null,
    ])
  );
}

async function mirrorGrupoEIntegralizacao(
  client: pg.PoolClient,
  tenant: MirrorTenant,
  snapshot: UserSqliteSnapshot
): Promise<void> {
  await client.query("DELETE FROM grupo_membros WHERE user_id = $1", [
    tenant.userId,
  ]);
  await batchInsert(
    client,
    "grupo_membros",
    ["user_id", "curso_id", "disciplina_id", "nome", "matricula", "email", "curso"],
    snapshot.grupoMembros.map((membro) => [
      tenant.userId, tenant.cursoId, membro.disciplina_id,
      membro.nome, membro.matricula, membro.email, membro.curso,
    ])
  );

  const protectedTipos = await client.query(
    `SELECT tipo_ch FROM integralizacao WHERE user_id = $1 AND manual = 1`,
    [tenant.userId]
  );
  const protectedKeys = new Set(
    protectedTipos.rows.map((row) => String(row.tipo_ch).toLowerCase())
  );

  await client.query(
    "DELETE FROM integralizacao WHERE user_id = $1 AND manual = 0",
    [tenant.userId]
  );
  await batchInsert(
    client,
    "integralizacao",
    ["user_id", "tipo_ch", "total_necessario", "concluido", "pendente", "manual"],
    snapshot.integralizacaoSynced
      .filter((row) => !protectedKeys.has(row.tipo_ch.toLowerCase()))
      .map((row) => [
        tenant.userId, row.tipo_ch, row.total_necessario,
        row.concluido, row.pendente, 0,
      ])
  );
}

async function mirrorConfig(
  client: pg.PoolClient,
  tenant: MirrorTenant,
  snapshot: UserSqliteSnapshot
): Promise<void> {
  for (const entry of snapshot.config) {
    await client.query(
      `INSERT INTO configuracoes (user_id, chave, valor)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, chave) DO UPDATE SET valor = EXCLUDED.valor`,
      [tenant.userId, entry.chave, entry.valor]
    );
  }
}

export async function mirrorUserTables(
  client: pg.PoolClient,
  tenant: MirrorTenant,
  snapshot: UserSqliteSnapshot
): Promise<void> {
  await upsertDisciplinasCatalog(client, tenant, snapshot);
  await mirrorAluno(client, tenant, snapshot);
  await mirrorHistorico(client, tenant, snapshot);
  await mirrorSemestreAtual(client, tenant, snapshot);
  await mirrorNotas(client, tenant, snapshot);
  await mirrorFaltas(client, tenant, snapshot);
  await mirrorTarefas(client, tenant, snapshot);
  await mirrorGrupoEIntegralizacao(client, tenant, snapshot);
  await mirrorConfig(client, tenant, snapshot);
}
