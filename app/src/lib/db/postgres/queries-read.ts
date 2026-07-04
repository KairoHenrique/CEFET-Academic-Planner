import { resolveDefaultCursoId } from "@/lib/db/backend/config";
import { getPostgresPool } from "@/lib/db/postgres/pool";
import type {
  AlunoRow,
  DisciplinaRow,
  FaltaRow,
  GrupoMembroRow,
  HistoricoRow,
  IntegralizacaoRow,
  NotaRow,
  SemestreAtualWithDisciplina,
  TarefaRow,
} from "@/lib/types/db";

const TENANT_SQL = "user_id IS NULL";
const cursoId = () => resolveDefaultCursoId();

function mapDisciplinaRow(row: Record<string, unknown>): DisciplinaRow {
  return {
    codigo: String(row.codigo),
    nome: String(row.nome),
    tipo: row.tipo != null ? String(row.tipo) : null,
    carga_horaria: row.carga_horaria != null ? Number(row.carga_horaria) : null,
    periodo: row.periodo != null ? Number(row.periodo) : null,
    ementa: row.ementa != null ? String(row.ementa) : null,
  };
}

function mapSemestreRow(row: Record<string, unknown>): SemestreAtualWithDisciplina {
  return {
    disciplina_id: String(row.disciplina_id),
    local: row.local != null ? String(row.local) : null,
    codigo_horario: row.codigo_horario != null ? String(row.codigo_horario) : null,
    horario_traduzido:
      row.horario_traduzido != null ? String(row.horario_traduzido) : null,
    cor: row.cor != null ? String(row.cor) : null,
    apelido: row.apelido != null ? String(row.apelido) : null,
    nome_exibicao: row.nome_exibicao != null ? String(row.nome_exibicao) : null,
    local_exibicao: row.local_exibicao != null ? String(row.local_exibicao) : null,
    horario_exibicao:
      row.horario_exibicao != null ? String(row.horario_exibicao) : null,
    professor_exibicao:
      row.professor_exibicao != null ? String(row.professor_exibicao) : null,
    horas_semanais_exibicao:
      row.horas_semanais_exibicao != null
        ? Number(row.horas_semanais_exibicao)
        : null,
    grupo_nome: row.grupo_nome != null ? String(row.grupo_nome) : null,
    professor: row.professor != null ? String(row.professor) : null,
    max_faltas: row.max_faltas != null ? Number(row.max_faltas) : null,
    nota_maxima: row.nota_maxima != null ? Number(row.nota_maxima) : null,
    nota_aprovacao: row.nota_aprovacao != null ? Number(row.nota_aprovacao) : null,
    arquivos_baixados:
      row.arquivos_baixados != null ? Number(row.arquivos_baixados) : null,
    pdf_auto_download:
      row.pdf_auto_download != null ? Number(row.pdf_auto_download) : null,
    turma_data_inicio:
      row.turma_data_inicio != null ? String(row.turma_data_inicio) : null,
    turma_data_fim: row.turma_data_fim != null ? String(row.turma_data_fim) : null,
    nome: String(row.nome),
    carga_horaria: row.carga_horaria != null ? Number(row.carga_horaria) : null,
  };
}

export async function pgGetAluno(): Promise<AlunoRow | undefined> {
  const result = await getPostgresPool().query(
    `SELECT matricula, nome, curso, email, semestre_entrada, rg, status
     FROM aluno WHERE ${TENANT_SQL} LIMIT 1`
  );
  return (result.rows[0] as AlunoRow | undefined) ?? undefined;
}

export async function pgGetDisciplinas(): Promise<DisciplinaRow[]> {
  const result = await getPostgresPool().query(
    `SELECT codigo, nome, tipo, carga_horaria, periodo, ementa
     FROM disciplinas WHERE curso_id = $1 ORDER BY periodo, nome`,
    [cursoId()]
  );
  return result.rows.map((row) => mapDisciplinaRow(row));
}

export async function pgGetDisciplinaByCodigo(
  codigo: string
): Promise<DisciplinaRow | undefined> {
  const result = await getPostgresPool().query(
    `SELECT codigo, nome, tipo, carga_horaria, periodo, ementa
     FROM disciplinas WHERE curso_id = $1 AND LOWER(codigo) = LOWER($2) LIMIT 1`,
    [cursoId(), codigo]
  );
  const row = result.rows[0];
  return row ? mapDisciplinaRow(row) : undefined;
}

export async function pgGetHistorico(): Promise<HistoricoRow[]> {
  const result = await getPostgresPool().query(
    `SELECT id, disciplina_id, semestre, status, nota_final
     FROM historico WHERE ${TENANT_SQL} ORDER BY id`,
    []
  );
  return result.rows as HistoricoRow[];
}

export async function pgGetIntegralizacao(): Promise<IntegralizacaoRow[]> {
  const result = await getPostgresPool().query(
    `SELECT id, tipo_ch, total_necessario, concluido, pendente, manual
     FROM integralizacao WHERE ${TENANT_SQL} ORDER BY id`
  );
  return result.rows.map((row) => ({
    id: Number(row.id),
    tipo_ch: String(row.tipo_ch),
    total_necessario:
      row.total_necessario != null ? Number(row.total_necessario) : null,
    concluido: row.concluido != null ? Number(row.concluido) : null,
    pendente: row.pendente != null ? Number(row.pendente) : null,
    manual: Number(row.manual ?? 0),
  }));
}

export async function pgGetSemestreAtual(): Promise<SemestreAtualWithDisciplina[]> {
  const result = await getPostgresPool().query(
    `
    SELECT sa.*, d.nome, d.carga_horaria
    FROM semestre_atual sa
    JOIN disciplinas d
      ON d.curso_id = sa.curso_id AND d.codigo = sa.disciplina_id
    WHERE sa.${TENANT_SQL} AND sa.curso_id = $1
    ORDER BY d.nome
    `,
    [cursoId()]
  );
  return result.rows.map((row) => mapSemestreRow(row));
}

export async function pgGetSemestreAtualByCodigo(
  codigo: string
): Promise<SemestreAtualWithDisciplina | undefined> {
  const result = await getPostgresPool().query(
    `
    SELECT sa.*, d.nome, d.carga_horaria
    FROM semestre_atual sa
    JOIN disciplinas d
      ON d.curso_id = sa.curso_id AND d.codigo = sa.disciplina_id
    WHERE sa.${TENANT_SQL}
      AND sa.curso_id = $1
      AND LOWER(sa.disciplina_id) = LOWER($2)
    LIMIT 1
    `,
    [cursoId(), codigo]
  );
  const row = result.rows[0];
  return row ? mapSemestreRow(row) : undefined;
}

export async function pgGetTarefas(): Promise<TarefaRow[]> {
  const result = await getPostgresPool().query(
    `SELECT * FROM tarefas WHERE ${TENANT_SQL} ORDER BY data_fim, id`
  );
  return result.rows.map(mapTarefaRow);
}

export async function pgGetTarefasByDisciplina(
  disciplinaId: string
): Promise<TarefaRow[]> {
  const result = await getPostgresPool().query(
    `SELECT * FROM tarefas
     WHERE ${TENANT_SQL} AND curso_id = $1 AND LOWER(disciplina_id) = LOWER($2)
     ORDER BY data_fim, id`,
    [cursoId(), disciplinaId]
  );
  return result.rows.map(mapTarefaRow);
}

export async function pgGetFaltasByDisciplina(
  disciplinaId: string
): Promise<FaltaRow[]> {
  const result = await getPostgresPool().query(
    `SELECT * FROM faltas
     WHERE ${TENANT_SQL} AND curso_id = $1 AND LOWER(disciplina_id) = LOWER($2)
     ORDER BY data, id`,
    [cursoId(), disciplinaId]
  );
  return result.rows.map(mapFaltaRow);
}

export async function pgGetGrupoByDisciplina(
  disciplinaId: string
): Promise<GrupoMembroRow[]> {
  const result = await getPostgresPool().query(
    `SELECT * FROM grupo_membros
     WHERE ${TENANT_SQL} AND curso_id = $1 AND LOWER(disciplina_id) = LOWER($2)
     ORDER BY id`,
    [cursoId(), disciplinaId]
  );
  return result.rows.map((row) => ({
    id: Number(row.id),
    disciplina_id: String(row.disciplina_id),
    nome: String(row.nome),
    matricula: row.matricula != null ? String(row.matricula) : null,
    email: row.email != null ? String(row.email) : null,
    curso: row.curso != null ? String(row.curso) : null,
  }));
}

function mapTarefaRow(row: Record<string, unknown>): TarefaRow {
  return {
    id: Number(row.id),
    disciplina_id: String(row.disciplina_id),
    titulo: String(row.titulo),
    descricao: row.descricao != null ? String(row.descricao) : null,
    data_inicio: row.data_inicio != null ? String(row.data_inicio) : null,
    data_fim: row.data_fim != null ? String(row.data_fim) : null,
    hora_fim: row.hora_fim != null ? String(row.hora_fim) : null,
    tipo: row.tipo as TarefaRow["tipo"],
    possui_nota: Number(row.possui_nota ?? 0),
    concluida: Number(row.concluida ?? 0),
    manual: Number(row.manual ?? 0),
    concluida_override:
      row.concluida_override != null ? Number(row.concluida_override) : undefined,
    instrucoes: row.instrucoes != null ? String(row.instrucoes) : null,
    entregaveis: row.entregaveis != null ? String(row.entregaveis) : null,
    pontuacao_maxima:
      row.pontuacao_maxima != null ? Number(row.pontuacao_maxima) : null,
  };
}

function mapFaltaRow(row: Record<string, unknown>): FaltaRow {
  return {
    id: Number(row.id),
    disciplina_id: String(row.disciplina_id),
    data: String(row.data),
    status: row.status as FaltaRow["status"],
    quantidade: row.quantidade != null ? Number(row.quantidade) : undefined,
    manual: row.manual != null ? Number(row.manual) : undefined,
    status_override:
      row.status_override != null ? Number(row.status_override) : undefined,
  };
}

export async function pgGetNotasByDisciplina(
  disciplinaId: string
): Promise<NotaRow[]> {
  const result = await getPostgresPool().query(
    `SELECT * FROM notas
     WHERE ${TENANT_SQL} AND curso_id = $1 AND LOWER(disciplina_id) = LOWER($2)
     ORDER BY id`,
    [cursoId(), disciplinaId]
  );
  return result.rows.map((row) => ({
    id: Number(row.id),
    disciplina_id: String(row.disciplina_id),
    avaliacao_nome: String(row.avaliacao_nome),
    nota_maxima: row.nota_maxima != null ? Number(row.nota_maxima) : null,
    nota_obtida: row.nota_obtida != null ? Number(row.nota_obtida) : null,
    manual: Number(row.manual ?? 0),
    nota_override:
      row.nota_override != null ? Number(row.nota_override) : undefined,
    nota_extra: row.nota_extra != null ? Number(row.nota_extra) : undefined,
  }));
}
