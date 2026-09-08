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
}
