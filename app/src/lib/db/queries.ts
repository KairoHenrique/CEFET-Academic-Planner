import db from "./index";
import {
  isValidCalendarioEventoLabel,
  isValidCalendarioIsoDate,
} from "@/lib/scraper/calendario/calendario-event-filter";
import { isPpcCanonicalCodigo } from "@/lib/scraper/portal-discente/resolve-disciplina-codigo";
import type {
  AlunoRow,
  CalendarioAcademicoRow,
  DisciplinaRow,
  EventoCalendarioRow,
  FaltaRow,
  GrupoMembroRow,
  HistoricoRow,
  IntegralizacaoRow,
  NotaRow,
  RequisitoRow,
  SemestreAtualRow,
  SemestreAtualWithDisciplina,
  TarefaCalendarRow,
  TarefaRow,
  TurmaOfertadaRow,
} from "@/lib/types/db";
import {
  hasUserSemestrePreferences,
  isFaltaProtectedByUser,
  isIntegralizacaoProtectedByUser,
  isNotaProtectedByUser,
  mergeSemestreUserPreferences,
} from "@/lib/sync/user-data-priority";

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

/** Atualiza só o saldo do RU — não mexe nos demais campos do aluno. */
export function updateAlunoRuSaldo(
  refeicoesDisponiveis: number,
  syncedAt: string
): void {
  db.prepare(
    `
    UPDATE aluno
    SET refeicoes_disponiveis = ?,
        ru_synced_at = ?
  `
  ).run(refeicoesDisponiveis, syncedAt);
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

/** Atualiza disciplina do portal sem apagar metadados do PPC (CH, período, ementa). */
export function upsertPortalDisciplina(params: {
  codigo: string;
  nome: string;
}): void {
  const existing = getDisciplinaByCodigo(params.codigo);
  if (existing && isPpcCanonicalCodigo(existing.codigo)) {
    return;
  }
  saveDisciplina({
    codigo: params.codigo,
    nome: params.nome,
    tipo: existing?.tipo ?? "Obrigatória",
    carga_horaria: existing?.carga_horaria ?? null,
    periodo: existing?.periodo ?? null,
    ementa: existing?.ementa ?? null,
  });
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

export function getSemestreAtualByCodigo(
  codigo: string
): SemestreAtualWithDisciplina | undefined {
  return db
    .prepare(
      `
    SELECT sa.*, d.nome, d.carga_horaria
    FROM semestre_atual sa
    JOIN disciplinas d ON d.codigo = sa.disciplina_id
    WHERE sa.disciplina_id = ? COLLATE NOCASE
  `
    )
    .get(codigo) as SemestreAtualWithDisciplina | undefined;
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
      disciplina_id, local, local_exibicao, codigo_horario, horario_traduzido,
      horario_exibicao, professor, professor_exibicao, horas_semanais_exibicao,
      cor, apelido, nome_exibicao, max_faltas, nota_maxima, nota_aprovacao,
      arquivos_baixados, pdf_auto_download, turma_data_inicio, turma_data_fim
    )
    VALUES (
      @disciplina_id, @local, @local_exibicao, @codigo_horario, @horario_traduzido,
      @horario_exibicao, @professor, @professor_exibicao, @horas_semanais_exibicao,
      @cor, @apelido, @nome_exibicao, @max_faltas, @nota_maxima, @nota_aprovacao,
      @arquivos_baixados, @pdf_auto_download, @turma_data_inicio, @turma_data_fim
    )
    ON CONFLICT(disciplina_id) DO UPDATE SET
      local = excluded.local,
      local_exibicao = excluded.local_exibicao,
      codigo_horario = excluded.codigo_horario,
      horario_traduzido = excluded.horario_traduzido,
      horario_exibicao = excluded.horario_exibicao,
      professor = excluded.professor,
      professor_exibicao = excluded.professor_exibicao,
      horas_semanais_exibicao = excluded.horas_semanais_exibicao,
      cor = excluded.cor,
      apelido = excluded.apelido,
      nome_exibicao = excluded.nome_exibicao,
      max_faltas = excluded.max_faltas,
      nota_maxima = excluded.nota_maxima,
      nota_aprovacao = excluded.nota_aprovacao,
      arquivos_baixados = excluded.arquivos_baixados,
      pdf_auto_download = excluded.pdf_auto_download,
      turma_data_inicio = excluded.turma_data_inicio,
      turma_data_fim = excluded.turma_data_fim
  `
  ).run({
    ...entry,
    apelido: entry.apelido ?? null,
    nome_exibicao: entry.nome_exibicao ?? null,
    local_exibicao: entry.local_exibicao ?? null,
    horario_exibicao: entry.horario_exibicao ?? null,
    professor_exibicao: entry.professor_exibicao ?? null,
    horas_semanais_exibicao: entry.horas_semanais_exibicao ?? null,
    turma_data_inicio: entry.turma_data_inicio ?? null,
    turma_data_fim: entry.turma_data_fim ?? null,
  });
}

/** Atualiza dados do SIGAA preservando personalizações do usuário. */
export function upsertSyncedSemestreAtual(entry: SemestreAtualRow): void {
  const existing = getSemestreDisciplina(entry.disciplina_id);
  saveSemestreAtual(mergeSemestreUserPreferences(entry, existing));
}

export function pruneSyncedSemestreAtual(activeDisciplinaIds: string[]): void {
  const rows = getSemestreAtual();
  const active = new Set(activeDisciplinaIds.map((id) => id.toLowerCase()));

  for (const row of rows) {
    if (active.has(row.disciplina_id.toLowerCase())) continue;
    if (hasUserSemestrePreferences(row)) continue;
    db.prepare("DELETE FROM semestre_atual WHERE disciplina_id = ?").run(
      row.disciplina_id
    );
  }
}

export function updateSemestreAtualColor(
  disciplinaId: string,
  cor: string
): number {
  return updateSemestreAtualAppearance(disciplinaId, { cor });
}

export function updateSemestreAtualAppearance(
  disciplinaId: string,
  fields: {
    cor?: string;
    apelido?: string | null;
    nome_exibicao?: string | null;
    local_exibicao?: string | null;
    horario_exibicao?: string | null;
    professor_exibicao?: string | null;
    horas_semanais_exibicao?: number | null;
  }
): number {
  const sets: string[] = [];
  const params: unknown[] = [];

  if (fields.cor !== undefined) {
    sets.push("cor = ?");
    params.push(fields.cor);
  }

  if (fields.apelido !== undefined) {
    sets.push("apelido = ?");
    params.push(fields.apelido);
  }

  if (fields.nome_exibicao !== undefined) {
    sets.push("nome_exibicao = ?");
    params.push(fields.nome_exibicao);
  }

  if (fields.local_exibicao !== undefined) {
    sets.push("local_exibicao = ?");
    params.push(fields.local_exibicao);
  }

  if (fields.horario_exibicao !== undefined) {
    sets.push("horario_exibicao = ?");
    params.push(fields.horario_exibicao);
  }

  if (fields.professor_exibicao !== undefined) {
    sets.push("professor_exibicao = ?");
    params.push(fields.professor_exibicao);
  }

  if (fields.horas_semanais_exibicao !== undefined) {
    sets.push("horas_semanais_exibicao = ?");
    params.push(fields.horas_semanais_exibicao);
  }

  if (sets.length === 0) return 0;

  params.push(disciplinaId);
  return db
    .prepare(
      `UPDATE semestre_atual SET ${sets.join(", ")} WHERE disciplina_id = ?`
    )
    .run(...params).changes;
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

/** Todas as notas do curso ativo (bulk — evita N+1 no mapa). */
export function getAllNotas(): NotaRow[] {
  return db
    .prepare("SELECT * FROM notas ORDER BY disciplina_id, id")
    .all() as NotaRow[];
}

export function getNotasForSemestreAtual(): NotaRow[] {
  return db
    .prepare(
      `SELECT n.* FROM notas n
       INNER JOIN semestre_atual s ON s.disciplina_id = n.disciplina_id
       ORDER BY n.disciplina_id, n.id`
    )
    .all() as NotaRow[];
}

export function getNotaByDisciplinaAndNome(
  disciplinaId: string,
  avaliacaoNome: string
): NotaRow | undefined {
  return db
    .prepare(
      `SELECT * FROM notas
       WHERE disciplina_id = ? COLLATE NOCASE
         AND avaliacao_nome = ? COLLATE NOCASE`
    )
    .get(disciplinaId, avaliacaoNome) as NotaRow | undefined;
}

export function upsertSyncedNota(
  nota: Omit<NotaRow, "id" | "nota_override"> & { nota_override?: number }
): void {
  const existing = getNotaByDisciplinaAndNome(
    nota.disciplina_id,
    nota.avaliacao_nome
  );

  if (existing) {
    if (isNotaProtectedByUser(existing)) return;

    const notaMaxima = nota.nota_maxima ?? existing.nota_maxima;
    const notaObtida =
      nota.nota_obtida !== null && nota.nota_obtida !== undefined
        ? nota.nota_obtida
        : existing.nota_obtida;

    db.prepare(
      `UPDATE notas
       SET nota_maxima = ?, nota_obtida = ?, manual = ?
       WHERE id = ?`
    ).run(notaMaxima, notaObtida, nota.manual, existing.id);
    return;
  }

  saveNota({
    ...nota,
    nota_override: 0,
  });
}

export function saveNota(nota: Omit<NotaRow, "id"> & { nota_override?: number }): void {
  db.prepare(
    `
    INSERT INTO notas (disciplina_id, avaliacao_nome, nota_maxima, nota_obtida, manual, nota_override, nota_extra)
    VALUES (@disciplina_id, @avaliacao_nome, @nota_maxima, @nota_obtida, @manual, @nota_override, @nota_extra)
  `
  ).run({
    ...nota,
    nota_override: nota.nota_override ?? 0,
    nota_extra: nota.nota_extra ?? 0,
  });
}

export function getNotaById(id: number): NotaRow | undefined {
  return db.prepare("SELECT * FROM notas WHERE id = ?").get(id) as
    | NotaRow
    | undefined;
}

export function notaNomeExists(
  disciplinaId: string,
  avaliacaoNome: string,
  excludeId?: number
): boolean {
  const row = db
    .prepare(
      `
    SELECT COUNT(*) as total FROM notas
    WHERE disciplina_id = ? COLLATE NOCASE
      AND avaliacao_nome = ? COLLATE NOCASE
      AND (? IS NULL OR id != ?)
  `
    )
    .get(disciplinaId, avaliacaoNome, excludeId ?? null, excludeId ?? null) as {
    total: number;
  };
  return row.total > 0;
}

export function updateNotaObtida(id: number, notaObtida: number | null): number {
  const result = db
    .prepare(`UPDATE notas SET nota_obtida = ? WHERE id = ? AND manual = 1`)
    .run(notaObtida, id);
  return result.changes;
}

export function updateNotaScore(id: number, notaObtida: number | null): number {
  const result = db
    .prepare(
      `UPDATE notas SET nota_obtida = ?, nota_override = 1 WHERE id = ?`
    )
    .run(notaObtida, id);
  return result.changes;
}

export function updateNotaFields(
  id: number,
  fields: {
    avaliacao_nome?: string;
    nota_maxima?: number;
    nota_obtida?: number | null;
    nota_override?: number;
    nota_extra?: number;
    manual?: number;
  }
): number {
  const sets: string[] = [];
  const params: Array<string | number | null> = [];

  if (fields.avaliacao_nome !== undefined) {
    sets.push("avaliacao_nome = ?");
    params.push(fields.avaliacao_nome);
  }
  if (fields.nota_maxima !== undefined) {
    sets.push("nota_maxima = ?");
    params.push(fields.nota_maxima);
  }
  if (fields.nota_obtida !== undefined) {
    sets.push("nota_obtida = ?");
    params.push(fields.nota_obtida);
  }
  if (fields.nota_override !== undefined) {
    sets.push("nota_override = ?");
    params.push(fields.nota_override);
  }
  if (fields.nota_extra !== undefined) {
    sets.push("nota_extra = ?");
    params.push(fields.nota_extra);
  }
  if (fields.manual !== undefined) {
    sets.push("manual = ?");
    params.push(fields.manual);
  }

  if (sets.length === 0) return 0;

  params.push(id);
  const result = db
    .prepare(`UPDATE notas SET ${sets.join(", ")} WHERE id = ?`)
    .run(...params);
  return result.changes;
}

export function updateManualNotaFields(
  id: number,
  fields: { avaliacao_nome?: string; nota_maxima?: number; nota_obtida?: number | null }
): number {
  return updateNotaFields(id, fields);
}

export function deleteNota(id: number): number {
  const result = db.prepare(`DELETE FROM notas WHERE id = ?`).run(id);
  return result.changes;
}

export function clearNotasSynced(): void {
  db.prepare(
    "DELETE FROM notas WHERE manual = 0 AND COALESCE(nota_override, 0) = 0"
  ).run();
}

export function clearNotasSyncedForDisciplina(disciplinaId: string): void {
  db.prepare(
    `DELETE FROM notas
     WHERE disciplina_id = ? COLLATE NOCASE
       AND manual = 0
       AND COALESCE(nota_override, 0) = 0`
  ).run(disciplinaId);
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
      `SELECT COALESCE(SUM(
         CASE
           WHEN status = 'falta' AND COALESCE(quantidade, 0) > 0 THEN quantidade
           WHEN status = 'falta' THEN 1
           ELSE 0
         END
       ), 0) as total FROM faltas
       WHERE disciplina_id = ?`
    )
    .get(disciplinaId) as { total: number };
  return row.total;
}

export function saveFalta(falta: Omit<FaltaRow, "id">): void {
  db.prepare(
    `
    INSERT INTO faltas (disciplina_id, data, status, quantidade, manual, status_override)
    VALUES (@disciplina_id, @data, @status, @quantidade, @manual, @status_override)
  `
  ).run({
    ...falta,
    quantidade: falta.quantidade ?? 0,
    manual: falta.manual ?? 0,
    status_override: falta.status_override ?? 0,
  });
}

export function getFaltaByDisciplinaAndData(
  disciplinaId: string,
  data: string
): FaltaRow | undefined {
  return db
    .prepare(
      `SELECT * FROM faltas
       WHERE disciplina_id = ? COLLATE NOCASE AND data = ?`
    )
    .get(disciplinaId, data) as FaltaRow | undefined;
}

export function upsertSyncedFalta(falta: Omit<FaltaRow, "id">): void {
  const existing = getFaltaByDisciplinaAndData(falta.disciplina_id, falta.data);
  if (existing) {
    if (isFaltaProtectedByUser(existing)) return;
    db.prepare("UPDATE faltas SET status = ?, quantidade = ? WHERE id = ?").run(
      falta.status,
      falta.quantidade ?? 0,
      existing.id
    );
    return;
  }

  saveFalta({ ...falta, manual: 0, status_override: 0 });
}

export function getFaltaById(id: number): FaltaRow | undefined {
  return db.prepare("SELECT * FROM faltas WHERE id = ?").get(id) as
    | FaltaRow
    | undefined;
}

export function updateFaltaStatus(
  id: number,
  status: FaltaRow["status"]
): number {
  const result = db
    .prepare(`UPDATE faltas SET status = ?, status_override = 1 WHERE id = ?`)
    .run(status, id);
  return result.changes;
}

export function clearFaltasSynced(): void {
  db.prepare(
    "DELETE FROM faltas WHERE manual = 0 AND COALESCE(status_override, 0) = 0"
  ).run();
}

export function clearFaltasSyncedForDisciplina(disciplinaId: string): void {
  db.prepare(
    `DELETE FROM faltas
     WHERE disciplina_id = ? COLLATE NOCASE
       AND manual = 0
       AND COALESCE(status_override, 0) = 0`
  ).run(disciplinaId);
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
      disciplina_id, titulo, descricao, data_inicio, data_fim, hora_fim, tipo,
      possui_nota, concluida, manual, instrucoes, entregaveis, pontuacao_maxima,
      sigaa_link_id
    )
    VALUES (
      @disciplina_id, @titulo, @descricao, @data_inicio, @data_fim, @hora_fim, @tipo,
      @possui_nota, @concluida, @manual, @instrucoes, @entregaveis, @pontuacao_maxima,
      @sigaa_link_id
    )
  `
  ).run({
    ...tarefa,
    hora_fim: tarefa.hora_fim ?? "23:59",
  });
}

export function updateTarefaFields(
  id: number,
  fields: Partial<
    Pick<
      TarefaRow,
      | "titulo"
      | "descricao"
      | "data_fim"
      | "hora_fim"
      | "tipo"
      | "possui_nota"
      | "concluida"
      | "pontuacao_maxima"
    >
  >
): number {
  const sets: string[] = [];
  const params: Array<string | number | null> = [];

  if (fields.titulo !== undefined) {
    sets.push("titulo = ?");
    params.push(fields.titulo);
  }
  if (fields.descricao !== undefined) {
    sets.push("descricao = ?");
    params.push(fields.descricao);
  }
  if (fields.data_fim !== undefined) {
    sets.push("data_fim = ?");
    params.push(fields.data_fim);
  }
  if (fields.hora_fim !== undefined) {
    sets.push("hora_fim = ?");
    params.push(fields.hora_fim);
  }
  if (fields.tipo !== undefined) {
    sets.push("tipo = ?");
    params.push(fields.tipo);
  }
  if (fields.possui_nota !== undefined) {
    sets.push("possui_nota = ?");
    params.push(fields.possui_nota);
  }
  if (fields.concluida !== undefined) {
    sets.push("concluida = ?");
    params.push(fields.concluida);
    sets.push("concluida_override = ?");
    params.push(1);
  }
  if (fields.pontuacao_maxima !== undefined) {
    sets.push("pontuacao_maxima = ?");
    params.push(fields.pontuacao_maxima);
  }

  if (sets.length === 0) return 0;

  params.push(id);
  return db
    .prepare(`UPDATE tarefas SET ${sets.join(", ")} WHERE id = ?`)
    .run(...params).changes;
}

export function deleteTarefa(id: number): number {
  return db.prepare("DELETE FROM tarefas WHERE id = ? AND manual = 1").run(id)
    .changes;
}

export function updateTarefaConcluida(id: number, concluida: boolean): void {
  db.prepare(
    "UPDATE tarefas SET concluida = ?, concluida_override = 1 WHERE id = ?"
  ).run(concluida ? 1 : 0, id);
}

export function getTarefaByDisciplinaAndTitulo(
  disciplinaId: string,
  titulo: string
): TarefaRow | undefined {
  return db
    .prepare(
      `SELECT * FROM tarefas
       WHERE disciplina_id = ? COLLATE NOCASE
         AND titulo = ? COLLATE NOCASE
         AND manual = 0`
    )
    .get(disciplinaId, titulo) as TarefaRow | undefined;
}

export function upsertSyncedTarefa(tarefa: Omit<TarefaRow, "id">): void {
  const existing = getTarefaByDisciplinaAndTitulo(
    tarefa.disciplina_id,
    tarefa.titulo
  );

  if (existing) {
    if (existing.manual === 1) return;

    const concluidaSync =
      (existing.concluida_override ?? 0) === 1
        ? existing.concluida
        : tarefa.concluida;

    const preserveRichContent =
      concluidaSync === 1 &&
      Boolean(existing.descricao?.trim()) &&
      !tarefa.descricao?.trim();

    if (preserveRichContent) {
      db.prepare(
        `
        UPDATE tarefas
        SET concluida = ?, data_fim = ?, hora_fim = ?
        WHERE id = ?
      `
      ).run(
        concluidaSync,
        tarefa.data_fim,
        tarefa.hora_fim ?? "23:59",
        existing.id
      );
      return;
    }

    const descricao = tarefa.descricao ?? existing.descricao;
    const instrucoes = tarefa.instrucoes ?? existing.instrucoes;
    const entregaveis = tarefa.entregaveis ?? existing.entregaveis;

    db.prepare(
      `
      UPDATE tarefas
      SET descricao = ?, data_inicio = ?, data_fim = ?, hora_fim = ?, tipo = ?,
          possui_nota = ?, instrucoes = ?, entregaveis = ?, pontuacao_maxima = ?,
          sigaa_link_id = COALESCE(?, sigaa_link_id),
          concluida = CASE WHEN COALESCE(concluida_override, 0) = 1 THEN concluida ELSE ? END
      WHERE id = ?
    `
    ).run(
      descricao,
      tarefa.data_inicio,
      tarefa.data_fim,
      tarefa.hora_fim ?? "23:59",
      tarefa.tipo,
      tarefa.possui_nota,
      instrucoes,
      entregaveis,
      tarefa.pontuacao_maxima,
      tarefa.sigaa_link_id ?? null,
      concluidaSync,
      existing.id
    );
    return;
  }

  saveTarefa({ ...tarefa, manual: 0, concluida_override: 0 });
}

export function clearTarefasSynced(): void {
  db.prepare(
    "DELETE FROM tarefas WHERE manual = 0 AND COALESCE(concluida_override, 0) = 0"
  ).run();
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
  db.prepare("UPDATE semestre_atual SET grupo_nome = NULL").run();
}

export function replaceSyncedGrupoForDisciplina(
  disciplinaId: string,
  membros: Array<Omit<GrupoMembroRow, "id" | "disciplina_id">>
): void {
  db.prepare("DELETE FROM grupo_membros WHERE disciplina_id = ?").run(disciplinaId);

  for (const membro of membros) {
    saveGrupoMembro({
      disciplina_id: disciplinaId,
      ...membro,
    });
  }
}

export function patchSyncedSemestreTurmaMetadata(
  disciplinaId: string,
  fields: {
    professor?: string | null;
    max_faltas?: number | null;
    grupo_nome?: string | null;
  }
): void {
  const sets: string[] = [];
  const params: Array<string | number | null> = [];

  if (fields.professor !== undefined) {
    sets.push("professor = ?");
    params.push(fields.professor);
  }

  if (fields.max_faltas !== undefined) {
    sets.push("max_faltas = ?");
    params.push(fields.max_faltas);
  }

  if (fields.grupo_nome !== undefined) {
    sets.push("grupo_nome = ?");
    params.push(fields.grupo_nome);
  }

  if (sets.length === 0) return;

  params.push(disciplinaId);
  db.prepare(`UPDATE semestre_atual SET ${sets.join(", ")} WHERE disciplina_id = ?`).run(
    ...params
  );
}

/** Remove dados sincronizados da turma virtual (B28). */
export function clearTurmaVirtualSyncedData(): void {
  const reset = db.transaction(() => {
    clearNotasSynced();
    clearFaltasSynced();
    clearGrupoSynced();
  });
  reset();
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

export function getIntegralizacaoSyncedByTipo(
  tipoCh: string
): IntegralizacaoRow | undefined {
  return db
    .prepare("SELECT * FROM integralizacao WHERE tipo_ch = ? AND manual = 0 LIMIT 1")
    .get(tipoCh) as IntegralizacaoRow | undefined;
}

export function upsertSyncedIntegralizacao(
  progresso: Omit<IntegralizacaoRow, "id">
): void {
  const existing = getIntegralizacaoSyncedByTipo(progresso.tipo_ch);

  if (existing) {
    if (isIntegralizacaoProtectedByUser(existing)) return;

    db.prepare(
      `
      UPDATE integralizacao
      SET total_necessario = ?, concluido = ?, pendente = ?
      WHERE id = ?
    `
    ).run(
      progresso.total_necessario,
      progresso.concluido,
      progresso.pendente,
      existing.id
    );
    return;
  }

  saveIntegralizacao({ ...progresso, manual: 0 });
}

export function insertManualIntegralizacaoHoras(
  tipoCh: string,
  horas: number
): IntegralizacaoRow {
  const result = db
    .prepare(
      `
    INSERT INTO integralizacao (tipo_ch, total_necessario, concluido, pendente, manual)
    VALUES (@tipo_ch, NULL, @horas, NULL, 1)
  `
    )
    .run({ tipo_ch: tipoCh, horas });

  const row = db
    .prepare("SELECT * FROM integralizacao WHERE id = ?")
    .get(result.lastInsertRowid) as IntegralizacaoRow | undefined;

  if (!row) {
    throw new Error("Falha ao registrar horas manuais.");
  }

  return row;
}

export function clearIntegralizacaoSynced(): void {
  db.prepare("DELETE FROM integralizacao WHERE manual = 0").run();
}

function clearSemestreAtualSynced(): void {
  const rows = getSemestreAtual();

  for (const row of rows) {
    if (hasUserSemestrePreferences(row)) continue;
    db.prepare("DELETE FROM semestre_atual WHERE disciplina_id = ?").run(
      row.disciplina_id
    );
  }
}

/** Remove apenas dados sincronizados do portal do discente (B27). */
export function clearPortalSyncedData(): void {
  const reset = db.transaction(() => {
    clearAluno();
    clearIntegralizacaoSynced();
    clearSemestreAtualSynced();
    clearTarefasSynced();
  });
  reset();
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

/** Remove linhas de turma/script/forum gravadas por parse incorreto (B66). */
export function purgeInvalidCalendarioAcademico(): number {
  const deleteStmt = db.prepare("DELETE FROM calendario_academico WHERE id = ?");
  let removed = 0;

  for (const row of getCalendarioAcademico()) {
    const validLabel = isValidCalendarioEventoLabel(row.evento);
    const validDates =
      isValidCalendarioIsoDate(row.data_inicio) &&
      (row.data_fim == null || isValidCalendarioIsoDate(row.data_fim));

    if (!validLabel || !validDates) {
      deleteStmt.run(row.id);
      removed++;
    }
  }

  return removed;
}

// --- TURMAS OFERTADAS (B67) ---
export function getTurmasOfertadas(semestre?: string): TurmaOfertadaRow[] {
  if (semestre?.trim()) {
    return db
      .prepare(
        "SELECT * FROM turmas_ofertadas WHERE semestre = ? ORDER BY nome, turma_codigo"
      )
      .all(semestre.trim()) as TurmaOfertadaRow[];
  }

  return db
    .prepare("SELECT * FROM turmas_ofertadas ORDER BY semestre DESC, nome, turma_codigo")
    .all() as TurmaOfertadaRow[];
}

export function saveTurmaOfertada(
  row: Omit<TurmaOfertadaRow, "id">
): void {
  db.prepare(
    `
    INSERT INTO turmas_ofertadas (
      turma_sigaa_id, sigaa_componente, codigo_disciplina, nome, turma_codigo, semestre,
      codigo_horario, horario_exibicao, local, professor,
      vagas, vagas_ocupadas, carga_horaria,
      situacao, tipo_turma, departamento, horario_indefinido, categoria,
      curso_id, synced_at
    ) VALUES (
      @turma_sigaa_id, @sigaa_componente, @codigo_disciplina, @nome, @turma_codigo, @semestre,
      @codigo_horario, @horario_exibicao, @local, @professor,
      @vagas, @vagas_ocupadas, @carga_horaria,
      @situacao, @tipo_turma, @departamento, @horario_indefinido, @categoria,
      @curso_id, @synced_at
    )
    ON CONFLICT(turma_sigaa_id) DO UPDATE SET
      sigaa_componente = excluded.sigaa_componente,
      codigo_disciplina = excluded.codigo_disciplina,
      nome = excluded.nome,
      turma_codigo = excluded.turma_codigo,
      semestre = excluded.semestre,
      codigo_horario = excluded.codigo_horario,
      horario_exibicao = excluded.horario_exibicao,
      local = excluded.local,
      professor = excluded.professor,
      vagas = excluded.vagas,
      vagas_ocupadas = excluded.vagas_ocupadas,
      carga_horaria = excluded.carga_horaria,
      situacao = excluded.situacao,
      tipo_turma = excluded.tipo_turma,
      departamento = excluded.departamento,
      horario_indefinido = excluded.horario_indefinido,
      categoria = excluded.categoria,
      curso_id = excluded.curso_id,
      synced_at = excluded.synced_at
  `
  ).run(row);
}

export function clearTurmasOfertadasForSemestre(semestre: string, cursoId: string): void {
  db.prepare("DELETE FROM turmas_ofertadas WHERE semestre = ? AND curso_id = ?").run(semestre, cursoId);
}

export function saveRequisitoDisciplina(row: {
  disciplina_codigo: string;
  requisito_codigo: string;
  tipo: string;
  curso_id: string; // Will be ignored in SQLite as it doesn't have it
}): void {
  db.prepare(
    `
    INSERT INTO requisitos (
      disciplina_id, requisito_id, tipo
    ) VALUES (
      @disciplina_codigo, @requisito_codigo, @tipo
    )
    ON CONFLICT(disciplina_id, requisito_id) DO NOTHING
    `
  ).run(row);
}

// --- SIMULADOR (B34) ---
export interface SimuladorSimulacaoRow {
  id: string;
  titulo: string;
  semestre: string;
  payload_json: string;
  created_at: string;
  updated_at: string;
}

export function listSimuladorSimulacoes(): SimuladorSimulacaoRow[] {
  return db
    .prepare(
      `SELECT id, titulo, semestre, payload_json, created_at, updated_at
       FROM simulador_simulacoes
       ORDER BY updated_at DESC`
    )
    .all() as SimuladorSimulacaoRow[];
}

export function getSimuladorSimulacaoById(
  id: string
): SimuladorSimulacaoRow | undefined {
  return db
    .prepare(
      `SELECT id, titulo, semestre, payload_json, created_at, updated_at
       FROM simulador_simulacoes WHERE id = ?`
    )
    .get(id) as SimuladorSimulacaoRow | undefined;
}

export function insertSimuladorSimulacao(row: SimuladorSimulacaoRow): void {
  db.prepare(
    `INSERT INTO simulador_simulacoes (
      id, titulo, semestre, payload_json, created_at, updated_at
    ) VALUES (
      @id, @titulo, @semestre, @payload_json, @created_at, @updated_at
    )`
  ).run(row);
}

export function deleteSimuladorSimulacao(id: string): boolean {
  const result = db
    .prepare("DELETE FROM simulador_simulacoes WHERE id = ?")
    .run(id);
  return result.changes > 0;
}

// --- CALENDÁRIO (leitura) ---
export function getTarefasForCalendar(): TarefaCalendarRow[] {
  return db
    .prepare(
      `
    SELECT t.*, d.nome AS disciplina_nome, s.apelido AS disciplina_apelido, s.cor AS cor
    FROM tarefas t
    JOIN disciplinas d ON t.disciplina_id = d.codigo
    LEFT JOIN semestre_atual s ON s.disciplina_id = t.disciplina_id
    WHERE COALESCE(t.data_fim, t.data_inicio) IS NOT NULL
    ORDER BY COALESCE(t.data_fim, t.data_inicio), t.id
  `
    )
    .all() as TarefaCalendarRow[];
}

export function getEventosCalendario(): EventoCalendarioRow[] {
  return db
    .prepare(
      `
    SELECT e.*, d.nome AS disciplina_nome, s.apelido AS disciplina_apelido
    FROM eventos_calendario e
    LEFT JOIN disciplinas d ON e.disciplina_id = d.codigo
    LEFT JOIN semestre_atual s ON s.disciplina_id = e.disciplina_id
    ORDER BY e.data, e.id
  `
    )
    .all() as EventoCalendarioRow[];
}

export function getTarefaCalendarByDisciplinaLatest(
  disciplinaId: string
): TarefaCalendarRow | undefined {
  return db
    .prepare(
      `
    SELECT t.*, d.nome AS disciplina_nome, s.apelido AS disciplina_apelido, s.cor AS cor
    FROM tarefas t
    JOIN disciplinas d ON t.disciplina_id = d.codigo
    LEFT JOIN semestre_atual s ON s.disciplina_id = t.disciplina_id
    WHERE t.disciplina_id = ?
    ORDER BY t.id DESC
    LIMIT 1
  `
    )
    .get(disciplinaId) as TarefaCalendarRow | undefined;
}

export function getEventoCalendarioById(id: number): EventoCalendarioRow | undefined {
  return db
    .prepare(
      `
    SELECT e.*, d.nome AS disciplina_nome, s.apelido AS disciplina_apelido
    FROM eventos_calendario e
    LEFT JOIN disciplinas d ON e.disciplina_id = d.codigo
    LEFT JOIN semestre_atual s ON s.disciplina_id = e.disciplina_id
    WHERE e.id = ?
  `
    )
    .get(id) as EventoCalendarioRow | undefined;
}

export function insertEventoCalendario(
  event: Omit<EventoCalendarioRow, "id" | "disciplina_nome" | "disciplina_apelido">
): number {
  const result = db
    .prepare(
      `
    INSERT INTO eventos_calendario (
      titulo, descricao, data, data_fim, hora_inicio, hora_fim,
      recorrencia, recorrencia_ate, recorrencia_dias, tipo, disciplina_id, cor, concluida, manual
    )
    VALUES (
      @titulo, @descricao, @data, @data_fim, @hora_inicio, @hora_fim,
      @recorrencia, @recorrencia_ate, @recorrencia_dias, @tipo, @disciplina_id, @cor, @concluida, @manual
    )
  `
    )
    .run({
      ...event,
      data_fim: event.data_fim ?? null,
      hora_inicio: event.hora_inicio ?? null,
      hora_fim: event.hora_fim ?? null,
      recorrencia: event.recorrencia ?? "none",
      recorrencia_ate: event.recorrencia_ate ?? null,
      recorrencia_dias: event.recorrencia_dias ?? null,
    });
  return Number(result.lastInsertRowid);
}

export function getTarefaCalendarById(id: number): TarefaCalendarRow | undefined {
  return db
    .prepare(
      `
    SELECT t.*, d.nome AS disciplina_nome, s.apelido AS disciplina_apelido, s.cor AS cor
    FROM tarefas t 
    JOIN disciplinas d ON t.disciplina_id = d.codigo 
    LEFT JOIN semestre_atual s ON s.disciplina_id = t.disciplina_id
    WHERE t.id = ?
  `
    )
    .get(id) as TarefaCalendarRow | undefined;
}

export function updateEventoCalendarioFields(
  id: number,
  fields: Partial<
      Pick<
      EventoCalendarioRow,
      | "titulo"
      | "descricao"
      | "data"
      | "data_fim"
      | "hora_inicio"
      | "hora_fim"
      | "recorrencia"
      | "recorrencia_ate"
      | "recorrencia_dias"
      | "tipo"
      | "disciplina_id"
      | "cor"
      | "concluida"
    >
  >
): number {
  const sets: string[] = [];
  const params: Array<string | number | null> = [];

  if (fields.titulo !== undefined) {
    sets.push("titulo = ?");
    params.push(fields.titulo);
  }
  if (fields.descricao !== undefined) {
    sets.push("descricao = ?");
    params.push(fields.descricao);
  }
  if (fields.data !== undefined) {
    sets.push("data = ?");
    params.push(fields.data);
  }
  if (fields.tipo !== undefined) {
    sets.push("tipo = ?");
    params.push(fields.tipo);
  }
  if (fields.disciplina_id !== undefined) {
    sets.push("disciplina_id = ?");
    params.push(fields.disciplina_id);
  }
  if (fields.cor !== undefined) {
    sets.push("cor = ?");
    params.push(fields.cor);
  }
  if (fields.concluida !== undefined) {
    sets.push("concluida = ?");
    params.push(fields.concluida);
  }

  if (sets.length === 0) return 0;

  params.push(id);
  return db
    .prepare(`UPDATE eventos_calendario SET ${sets.join(", ")} WHERE id = ?`)
    .run(...params).changes;
}

export function deleteEventoCalendario(id: number): number {
  return db
    .prepare("DELETE FROM eventos_calendario WHERE id = ? AND manual = 1")
    .run(id).changes;
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
    clearHistorico();
    clearSemestreAtual();
    clearNotasSynced();
    clearFaltasSynced();
    clearTarefasSynced();
    clearGrupoSynced();
    clearIntegralizacaoSynced();
    clearCalendarioAcademico();
  });
  reset();
}

/** Remove tarefas sync inválidas (menu JSF, sem prazo, título lixo). */
export function pruneInvalidSyncedTarefas(): void {
  db.prepare(
    `DELETE FROM tarefas
     WHERE manual = 0
       AND COALESCE(concluida_override, 0) = 0
       AND (
         data_fim IS NULL
         OR TRIM(data_fim) = ''
         OR LENGTH(TRIM(titulo)) < 4
         OR titulo LIKE '%Turma Virtual%'
         OR titulo LIKE '%Ver Notas%'
         OR titulo LIKE '%Ver Grupo%'
         OR titulo LIKE '%Frequência%'
         OR titulo LIKE '%Tarefas Individuais%'
         OR titulo LIKE '%Tarefas Em Grupo%'
       )`
  ).run();
}

/** Remove tarefas sincronizadas órfãs (disciplina fora do semestre atual). */
export function pruneOrphanSyncedTarefas(): void {
  db.prepare(
    `DELETE FROM tarefas
     WHERE manual = 0
       AND COALESCE(concluida_override, 0) = 0
       AND disciplina_id NOT IN (SELECT disciplina_id FROM semestre_atual)`
  ).run();
}
