import db from "./index";
import type {
  AlunoRow,
  CalendarioAcademicoRow,
  DisciplinaRow,
  FaltaRow,
  GrupoMembroRow,
  HistoricoRow,
  IntegralizacaoRow,
  NotaRow,
  RequisitoRow,
  SemestreAtualRow,
  SemestreAtualWithDisciplina,
  TarefaRow,
} from "@/lib/types/db";

// --- ALUNO ---
export function getAluno(): AlunoRow | undefined {
  return db.prepare("SELECT * FROM aluno LIMIT 1").get() as AlunoRow | undefined;
}

export function saveAluno(aluno: Omit<AlunoRow, never>): void {
  db.prepare(
    `
    INSERT INTO aluno (matricula, nome, curso, email, semestre_entrada, rg, status)
    VALUES (@matricula, @nome, @curso, @email, @semestre_entrada, @rg, @status)
    ON CONFLICT(matricula) DO UPDATE SET
      nome = excluded.nome,
      curso = excluded.curso,
      email = excluded.email,
      semestre_entrada = excluded.semestre_entrada,
      rg = excluded.rg,
      status = excluded.status
  `
  ).run(aluno);
}

export function clearAluno(): void {
  db.prepare("DELETE FROM aluno").run();
}

// --- DISCIPLINAS ---
export function getDisciplinas(): DisciplinaRow[] {
  return db.prepare("SELECT * FROM disciplinas ORDER BY periodo, nome").all() as DisciplinaRow[];
}

export function getDisciplinaByCodigo(codigo: string): DisciplinaRow | undefined {
  return db
    .prepare("SELECT * FROM disciplinas WHERE codigo = ? COLLATE NOCASE")
    .get(codigo) as DisciplinaRow | undefined;
}

export function countDisciplinas(): number {
  const row = db.prepare("SELECT COUNT(*) as total FROM disciplinas").get() as {
    total: number;
  };
  return row.total;
}

export function saveDisciplina(disciplina: Omit<DisciplinaRow, never>): void {
  db.prepare(
    `
    INSERT INTO disciplinas (codigo, nome, tipo, carga_horaria, periodo, ementa)
    VALUES (@codigo, @nome, @tipo, @carga_horaria, @periodo, @ementa)
    ON CONFLICT(codigo) DO UPDATE SET
      nome = excluded.nome,
      tipo = excluded.tipo,
      carga_horaria = excluded.carga_horaria,
      periodo = excluded.periodo,
      ementa = excluded.ementa
  `
  ).run(disciplina);
}

// --- REQUISITOS ---
export function getRequisitos(): RequisitoRow[] {
  return db.prepare("SELECT * FROM requisitos").all() as RequisitoRow[];
}

export function getRequisitosByDisciplina(disciplinaId: string): RequisitoRow[] {
  return db
    .prepare("SELECT * FROM requisitos WHERE disciplina_id = ?")
    .all(disciplinaId) as RequisitoRow[];
}

export function saveRequisito(requisito: RequisitoRow): void {
  db.prepare(
    `
    INSERT INTO requisitos (disciplina_id, requisito_id, tipo)
    VALUES (@disciplina_id, @requisito_id, @tipo)
    ON CONFLICT(disciplina_id, requisito_id) DO NOTHING
  `
  ).run(requisito);
}

// --- HISTÓRICO ---
export function getHistorico(): HistoricoRow[] {
  return db.prepare("SELECT * FROM historico ORDER BY semestre").all() as HistoricoRow[];
}

export function getHistoricoByDisciplina(disciplinaId: string): HistoricoRow[] {
  return db
    .prepare("SELECT * FROM historico WHERE disciplina_id = ? ORDER BY semestre")
    .all(disciplinaId) as HistoricoRow[];
}

export function saveHistorico(
  entry: Omit<HistoricoRow, "id">
): void {
  db.prepare(
    `
    INSERT INTO historico (disciplina_id, semestre, status, nota_final)
    VALUES (@disciplina_id, @semestre, @status, @nota_final)
  `
  ).run(entry);
}

export function clearHistorico(): void {
  db.prepare("DELETE FROM historico").run();
}

// --- SEMESTRE ATUAL ---
export function getSemestreAtual(): SemestreAtualWithDisciplina[] {
  return db
    .prepare(
      `
    SELECT sa.*, d.nome, d.carga_horaria
    FROM semestre_atual sa
    JOIN disciplinas d ON d.codigo = sa.disciplina_id
    ORDER BY d.nome
  `
    )
    .all() as SemestreAtualWithDisciplina[];
}

export function getSemestreDisciplina(
  disciplinaId: string
): SemestreAtualRow | undefined {
  return db
    .prepare("SELECT * FROM semestre_atual WHERE disciplina_id = ?")
    .get(disciplinaId) as SemestreAtualRow | undefined;
}

export function saveSemestreAtual(entry: SemestreAtualRow): void {
  db.prepare(
    `
    INSERT INTO semestre_atual (
      disciplina_id, local, codigo_horario, horario_traduzido,
      cor, professor, max_faltas, nota_maxima, nota_aprovacao,
      arquivos_baixados, pdf_auto_download
    )
    VALUES (
      @disciplina_id, @local, @codigo_horario, @horario_traduzido,
      @cor, @professor, @max_faltas, @nota_maxima, @nota_aprovacao,
      @arquivos_baixados, @pdf_auto_download
    )
    ON CONFLICT(disciplina_id) DO UPDATE SET
      local = excluded.local,
      codigo_horario = excluded.codigo_horario,
      horario_traduzido = excluded.horario_traduzido,
      cor = excluded.cor,
      professor = excluded.professor,
      max_faltas = excluded.max_faltas,
      nota_maxima = excluded.nota_maxima,
      nota_aprovacao = excluded.nota_aprovacao,
      arquivos_baixados = excluded.arquivos_baixados,
      pdf_auto_download = excluded.pdf_auto_download
  `
  ).run(entry);
}

export function clearSemestreAtual(): void {
  db.prepare("DELETE FROM semestre_atual").run();
}

// --- NOTAS ---
export function getNotasByDisciplina(disciplinaId: string): NotaRow[] {
  return db
    .prepare(
      "SELECT * FROM notas WHERE disciplina_id = ? ORDER BY id"
    )
    .all(disciplinaId) as NotaRow[];
}

export function saveNota(nota: Omit<NotaRow, "id">): void {
  db.prepare(
    `
    INSERT INTO notas (disciplina_id, avaliacao_nome, nota_maxima, nota_obtida, manual)
    VALUES (@disciplina_id, @avaliacao_nome, @nota_maxima, @nota_obtida, @manual)
  `
  ).run(nota);
}

export function clearNotasSynced(): void {
  db.prepare("DELETE FROM notas WHERE manual = 0").run();
}

// --- FALTAS ---
export function getFaltasByDisciplina(disciplinaId: string): FaltaRow[] {
  return db
    .prepare("SELECT * FROM faltas WHERE disciplina_id = ? ORDER BY data")
    .all(disciplinaId) as FaltaRow[];
}

export function countFaltasByDisciplina(disciplinaId: string): number {
  const row = db
    .prepare(
      `SELECT COUNT(*) as total FROM faltas
       WHERE disciplina_id = ? AND status = 'falta'`
    )
    .get(disciplinaId) as { total: number };
  return row.total;
}

export function saveFalta(falta: Omit<FaltaRow, "id">): void {
  db.prepare(
    `
    INSERT INTO faltas (disciplina_id, data, status)
    VALUES (@disciplina_id, @data, @status)
  `
  ).run(falta);
}

export function clearFaltasSynced(): void {
  db.prepare("DELETE FROM faltas").run();
}

// --- TAREFAS ---
export function getTarefas(): TarefaRow[] {
  return db.prepare("SELECT * FROM tarefas ORDER BY data_fim, id").all() as TarefaRow[];
}

export function getTarefaById(id: number): TarefaRow | undefined {
  return db.prepare("SELECT * FROM tarefas WHERE id = ?").get(id) as
    | TarefaRow
    | undefined;
}

export function getTarefasPendentes(): Array<
  TarefaRow & { disciplina_nome: string; disciplina_codigo: string }
> {
  return db
    .prepare(
      `
    SELECT t.*, d.nome as disciplina_nome, d.codigo as disciplina_codigo
    FROM tarefas t
    JOIN disciplinas d ON t.disciplina_id = d.codigo
    WHERE t.concluida = 0
    ORDER BY t.data_fim ASC, t.id ASC
  `
    )
    .all() as Array<
    TarefaRow & { disciplina_nome: string; disciplina_codigo: string }
  >;
}

export function getTarefasByDisciplina(disciplinaId: string): TarefaRow[] {
  return db
    .prepare(
      "SELECT * FROM tarefas WHERE disciplina_id = ? ORDER BY data_fim, id"
    )
    .all(disciplinaId) as TarefaRow[];
}

export function countTarefasPendentesByDisciplina(disciplinaId: string): number {
  const row = db
    .prepare(
      `SELECT COUNT(*) as total FROM tarefas
       WHERE disciplina_id = ? AND concluida = 0`
    )
    .get(disciplinaId) as { total: number };
  return row.total;
}

export function saveTarefa(tarefa: Omit<TarefaRow, "id">): void {
  db.prepare(
    `
    INSERT INTO tarefas (
      disciplina_id, titulo, descricao, data_inicio, data_fim, tipo,
      possui_nota, concluida, manual, instrucoes, entregaveis, pontuacao_maxima
    )
    VALUES (
      @disciplina_id, @titulo, @descricao, @data_inicio, @data_fim, @tipo,
      @possui_nota, @concluida, @manual, @instrucoes, @entregaveis, @pontuacao_maxima
    )
  `
  ).run(tarefa);
}

export function updateTarefaConcluida(id: number, concluida: boolean): void {
  db.prepare("UPDATE tarefas SET concluida = ? WHERE id = ?").run(
    concluida ? 1 : 0,
    id
  );
}

export function clearTarefasSynced(): void {
  db.prepare("DELETE FROM tarefas WHERE manual = 0").run();
}

// --- GRUPO ---
export function getGrupoByDisciplina(disciplinaId: string): GrupoMembroRow[] {
  return db
    .prepare("SELECT * FROM grupo_membros WHERE disciplina_id = ? ORDER BY nome")
    .all(disciplinaId) as GrupoMembroRow[];
}

export function saveGrupoMembro(membro: Omit<GrupoMembroRow, "id">): void {
  db.prepare(
    `
    INSERT INTO grupo_membros (disciplina_id, nome, matricula, email, curso)
    VALUES (@disciplina_id, @nome, @matricula, @email, @curso)
  `
  ).run(membro);
}

export function clearGrupoSynced(): void {
  db.prepare("DELETE FROM grupo_membros").run();
}

// --- INTEGRALIZAÇÃO ---
export function getIntegralizacao(): IntegralizacaoRow[] {
  return db
    .prepare("SELECT * FROM integralizacao ORDER BY id")
    .all() as IntegralizacaoRow[];
}

export function saveIntegralizacao(progresso: Omit<IntegralizacaoRow, "id">): void {
  db.prepare(
    `
    INSERT INTO integralizacao (tipo_ch, total_necessario, concluido, pendente, manual)
    VALUES (@tipo_ch, @total_necessario, @concluido, @pendente, @manual)
  `
  ).run(progresso);
}

export function clearIntegralizacaoSynced(): void {
  db.prepare("DELETE FROM integralizacao WHERE manual = 0").run();
}

// --- CALENDÁRIO ACADÊMICO ---
export function getCalendarioAcademico(): CalendarioAcademicoRow[] {
  return db
    .prepare("SELECT * FROM calendario_academico ORDER BY data_inicio")
    .all() as CalendarioAcademicoRow[];
}

export function saveCalendarioEvent(
  event: Omit<CalendarioAcademicoRow, "id">
): void {
  db.prepare(
    `
    INSERT INTO calendario_academico (evento, data_inicio, data_fim, semestre)
    VALUES (@evento, @data_inicio, @data_fim, @semestre)
  `
  ).run(event);
}

export function clearCalendarioAcademico(): void {
  db.prepare("DELETE FROM calendario_academico").run();
}

// --- CONFIGURAÇÕES ---
export function getConfig(chave: string): string | null {
  const result = db
    .prepare("SELECT valor FROM configuracoes WHERE chave = ?")
    .get(chave) as { valor: string } | undefined;
  return result?.valor ?? null;
}

export function setConfig(chave: string, valor: string): void {
  db.prepare(
    `
    INSERT INTO configuracoes (chave, valor)
    VALUES (?, ?)
    ON CONFLICT(chave) DO UPDATE SET valor = excluded.valor
  `
  ).run(chave, valor);
}

// --- SYNC RESET ---
export function clearSyncedStudentData(): void {
  const reset = db.transaction(() => {
    clearAluno();
    clearSemestreAtual();
    clearHistorico();
    clearNotasSynced();
    clearFaltasSynced();
    clearTarefasSynced();
    clearGrupoSynced();
    clearIntegralizacaoSynced();
    clearCalendarioAcademico();
  });
  reset();
}
