import type pg from "pg";
import { mergeSemestreUserPreferences } from "@/lib/sync/user-data-priority";
import type { SemestreAtualRow } from "@/lib/types/db";
import { batchInsert } from "@/lib/sync-mirror/pg-batch";
import type { MirrorTenant } from "@/lib/sync-mirror/resolve-mirror-tenant";
import type { UserSqliteSnapshot } from "@/lib/sync-mirror/read-sqlite-snapshot";

/**
 * Mirror parcial do R1 lite (portal no aparelho):
 * atualiza aluno / semestre / tarefas / integralização / config.
 * **Não** apaga histórico, notas, faltas nem grupo (camadas do TV/PDF).
 */
export async function mirrorPortalLiteUserTables(
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

  await client.query("DELETE FROM aluno WHERE user_id = $1", [tenant.userId]);
  if (snapshot.aluno) {
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

  await client.query(
    `DELETE FROM tarefas
     WHERE user_id = $1 AND curso_id = $2
       AND manual = 0 AND COALESCE(concluida_override, 0) = 0`,
    [tenant.userId, tenant.cursoId]
  );
  await batchInsert(
    client,
    "tarefas",
    [
      "user_id", "curso_id", "disciplina_id", "titulo", "descricao",
      "data_inicio", "data_fim", "hora_fim", "tipo", "possui_nota",
      "concluida", "manual", "instrucoes", "entregaveis", "pontuacao_maxima",
      "sigaa_link_id",
    ],
    snapshot.tarefasSynced.map((tarefa) => [
      tenant.userId, tenant.cursoId, tarefa.disciplina_id, tarefa.titulo,
      tarefa.descricao, tarefa.data_inicio, tarefa.data_fim, tarefa.hora_fim,
      tarefa.tipo, tarefa.possui_nota, tarefa.concluida, 0, tarefa.instrucoes,
      tarefa.entregaveis, tarefa.pontuacao_maxima, tarefa.sigaa_link_id ?? null,
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

  for (const entry of snapshot.config) {
    await client.query(
      `INSERT INTO configuracoes (user_id, chave, valor)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, chave) DO UPDATE SET valor = EXCLUDED.valor`,
      [tenant.userId, entry.chave, entry.valor]
    );
  }

  // B86: se o aparelho enviou notas/faltas raspadas, espelha (respeitando overrides).
  if (snapshot.notasSynced.length > 0) {
    const protectedNotas = await client.query(
      `SELECT disciplina_id, avaliacao_nome FROM notas
       WHERE user_id = $1 AND curso_id = $2
         AND (COALESCE(manual, 0) = 1 OR COALESCE(nota_override, 0) = 1)`,
      [tenant.userId, tenant.cursoId]
    );
    const protectedNotaKeys = new Set(
      protectedNotas.rows.map(
        (row) =>
          `${String(row.disciplina_id).toLowerCase()}\0${String(row.avaliacao_nome).toLowerCase()}`
      )
    );
    await client.query(
      `DELETE FROM notas
       WHERE user_id = $1 AND curso_id = $2
         AND COALESCE(manual, 0) = 0 AND COALESCE(nota_override, 0) = 0`,
      [tenant.userId, tenant.cursoId]
    );
    await batchInsert(
      client,
      "notas",
      [
        "user_id",
        "curso_id",
        "disciplina_id",
        "avaliacao_nome",
        "nota_maxima",
        "nota_obtida",
        "manual",
        "nota_override",
        "nota_extra",
      ],
      snapshot.notasSynced
        .filter(
          (nota) =>
            !protectedNotaKeys.has(
              `${nota.disciplina_id.toLowerCase()}\0${nota.avaliacao_nome.toLowerCase()}`
            )
        )
        .map((nota) => [
          tenant.userId,
          tenant.cursoId,
          nota.disciplina_id,
          nota.avaliacao_nome,
          nota.nota_maxima,
          nota.nota_obtida,
          0,
          0,
          nota.nota_extra ?? 0,
        ])
    );
  }

  if (snapshot.faltasSynced.length > 0) {
    const protectedFaltas = await client.query(
      `SELECT disciplina_id, data FROM faltas
       WHERE user_id = $1 AND curso_id = $2
         AND (COALESCE(manual, 0) = 1 OR COALESCE(status_override, 0) = 1)`,
      [tenant.userId, tenant.cursoId]
    );
    const protectedFaltaKeys = new Set(
      protectedFaltas.rows.map(
        (row) =>
          `${String(row.disciplina_id).toLowerCase()}\0${String(row.data)}`
      )
    );
    await client.query(
      `DELETE FROM faltas
       WHERE user_id = $1 AND curso_id = $2
         AND COALESCE(manual, 0) = 0 AND COALESCE(status_override, 0) = 0`,
      [tenant.userId, tenant.cursoId]
    );
    await batchInsert(
      client,
      "faltas",
      [
        "user_id",
        "curso_id",
        "disciplina_id",
        "data",
        "status",
        "manual",
        "status_override",
        "quantidade",
      ],
      snapshot.faltasSynced
        .filter(
          (falta) =>
            !protectedFaltaKeys.has(
              `${falta.disciplina_id.toLowerCase()}\0${falta.data}`
            )
        )
        .map((falta) => [
          tenant.userId,
          tenant.cursoId,
          falta.disciplina_id,
          falta.data,
          falta.status,
          0,
          0,
          falta.quantidade ?? 0,
        ])
    );
  }
}
