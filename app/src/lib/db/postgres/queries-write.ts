import { unauthorizedError } from "@/lib/api/errors";
import { resolveQueryCursoId } from "@/lib/db/resolve-query-curso-id";
import { getPostgresPool } from "@/lib/db/postgres/pool";
import { getActiveTenantUserId } from "@/lib/db/postgres/tenant-context";
import {
  mapEventoCalendarioRow,
  mapFaltaRow,
  mapNotaRow,
  mapTarefaCalendarRow,
  mapTarefaRow,
} from "@/lib/db/postgres/queries-read";
import type {
  EventoCalendarioRow,
  FaltaRow,
  NotaRow,
  TarefaCalendarRow,
  TarefaRow,
} from "@/lib/types/db";

interface Tenant {
  userId: string;
  cursoId: string;
}

/** Escopo obrigatório do tenant para escritas — bloqueia gravação sem sessão. */
function requireTenant(): Tenant {
  const userId = getActiveTenantUserId();
  if (!userId) {
    throw unauthorizedError("Sessão ausente para operação de escrita.");
  }
  return { userId, cursoId: resolveQueryCursoId() };
}

type SetEntry = [column: string, value: unknown];

/** Monta `col = $n` a partir de colunas fixas (sem interpolar dados do usuário). */
function buildSetClause(
  entries: SetEntry[],
  startIndex: number
): { clause: string; params: unknown[] } {
  const sets: string[] = [];
  const params: unknown[] = [];
  let index = startIndex;
  for (const [column, value] of entries) {
    sets.push(`${column} = $${index}`);
    params.push(value);
    index += 1;
  }
  return { clause: sets.join(", "), params };
}

// --- NOTAS ---
export interface InsertNotaInput {
  disciplina_id: string;
  avaliacao_nome: string;
  nota_maxima: number | null;
  nota_obtida: number | null;
  manual: number;
  nota_override?: number;
  nota_extra?: number;
}

export async function pgInsertNota(input: InsertNotaInput): Promise<void> {
  const { userId, cursoId } = requireTenant();
  await getPostgresPool().query(
    `INSERT INTO notas
       (user_id, curso_id, disciplina_id, avaliacao_nome, nota_maxima,
        nota_obtida, manual, nota_override, nota_extra)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [
      userId,
      cursoId,
      input.disciplina_id,
      input.avaliacao_nome,
      input.nota_maxima,
      input.nota_obtida,
      input.manual,
      input.nota_override ?? 0,
      input.nota_extra ?? 0,
    ]
  );
}

export async function pgGetNotaById(id: number): Promise<NotaRow | undefined> {
  const { userId, cursoId } = requireTenant();
  const result = await getPostgresPool().query(
    `SELECT * FROM notas WHERE id = $1 AND user_id = $2 AND curso_id = $3 LIMIT 1`,
    [id, userId, cursoId]
  );
  const row = result.rows[0];
  return row ? mapNotaRow(row) : undefined;
}

export async function pgNotaNomeExists(
  disciplinaId: string,
  avaliacaoNome: string,
  excludeId?: number
): Promise<boolean> {
  const { userId, cursoId } = requireTenant();
  const result = await getPostgresPool().query(
    `SELECT 1 FROM notas
     WHERE user_id = $1 AND curso_id = $2
       AND LOWER(disciplina_id) = LOWER($3)
       AND LOWER(avaliacao_nome) = LOWER($4)
       AND ($5::bigint IS NULL OR id <> $5)
     LIMIT 1`,
    [userId, cursoId, disciplinaId, avaliacaoNome, excludeId ?? null]
  );
  return result.rows.length > 0;
}

export async function pgUpdateNotaScore(
  id: number,
  notaObtida: number | null
): Promise<number> {
  const { userId, cursoId } = requireTenant();
  const result = await getPostgresPool().query(
    `UPDATE notas SET nota_obtida = $1, nota_override = 1
     WHERE id = $2 AND user_id = $3 AND curso_id = $4`,
    [notaObtida, id, userId, cursoId]
  );
  return result.rowCount ?? 0;
}

export interface UpdateNotaFields {
  avaliacao_nome?: string;
  nota_maxima?: number;
  nota_obtida?: number | null;
  nota_override?: number;
  nota_extra?: number;
  manual?: number;
}

export async function pgUpdateNotaFields(
  id: number,
  fields: UpdateNotaFields
): Promise<number> {
  const entries: SetEntry[] = [];
  if (fields.avaliacao_nome !== undefined) entries.push(["avaliacao_nome", fields.avaliacao_nome]);
  if (fields.nota_maxima !== undefined) entries.push(["nota_maxima", fields.nota_maxima]);
  if (fields.nota_obtida !== undefined) entries.push(["nota_obtida", fields.nota_obtida]);
  if (fields.nota_override !== undefined) entries.push(["nota_override", fields.nota_override]);
  if (fields.nota_extra !== undefined) entries.push(["nota_extra", fields.nota_extra]);
  if (fields.manual !== undefined) entries.push(["manual", fields.manual]);
  if (entries.length === 0) return 0;

  const { userId, cursoId } = requireTenant();
  const { clause, params } = buildSetClause(entries, 1);
  const next = params.length + 1;
  const result = await getPostgresPool().query(
    `UPDATE notas SET ${clause}
     WHERE id = $${next} AND user_id = $${next + 1} AND curso_id = $${next + 2}`,
    [...params, id, userId, cursoId]
  );
  return result.rowCount ?? 0;
}

export async function pgDeleteNota(id: number): Promise<number> {
  const { userId, cursoId } = requireTenant();
  const result = await getPostgresPool().query(
    `DELETE FROM notas WHERE id = $1 AND user_id = $2 AND curso_id = $3`,
    [id, userId, cursoId]
  );
  return result.rowCount ?? 0;
}

// --- FALTAS ---
export async function pgGetFaltaById(id: number): Promise<FaltaRow | undefined> {
  const { userId, cursoId } = requireTenant();
  const result = await getPostgresPool().query(
    `SELECT * FROM faltas WHERE id = $1 AND user_id = $2 AND curso_id = $3 LIMIT 1`,
    [id, userId, cursoId]
  );
  const row = result.rows[0];
  return row ? mapFaltaRow(row) : undefined;
}

export async function pgUpdateFaltaStatus(
  id: number,
  status: FaltaRow["status"]
): Promise<number> {
  const { userId, cursoId } = requireTenant();
  const result = await getPostgresPool().query(
    `UPDATE faltas SET status = $1, status_override = 1
     WHERE id = $2 AND user_id = $3 AND curso_id = $4`,
    [status, id, userId, cursoId]
  );
  return result.rowCount ?? 0;
}

// --- TAREFAS ---
export interface InsertTarefaInput {
  disciplina_id: string;
  titulo: string;
  descricao: string | null;
  data_inicio: string | null;
  data_fim: string | null;
  hora_fim: string | null;
  tipo: TarefaRow["tipo"];
  possui_nota: number;
  concluida: number;
  manual: number;
  instrucoes: string | null;
  entregaveis: string | null;
  pontuacao_maxima: number | null;
}

export async function pgInsertTarefa(input: InsertTarefaInput): Promise<number> {
  const { userId, cursoId } = requireTenant();
  const result = await getPostgresPool().query(
    `INSERT INTO tarefas
       (user_id, curso_id, disciplina_id, titulo, descricao, data_inicio,
        data_fim, hora_fim, tipo, possui_nota, concluida, manual,
        instrucoes, entregaveis, pontuacao_maxima)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
     RETURNING id`,
    [
      userId,
      cursoId,
      input.disciplina_id,
      input.titulo,
      input.descricao,
      input.data_inicio,
      input.data_fim,
      input.hora_fim ?? "23:59",
      input.tipo,
      input.possui_nota,
      input.concluida,
      input.manual,
      input.instrucoes,
      input.entregaveis,
      input.pontuacao_maxima,
    ]
  );
  return Number(result.rows[0].id);
}

export async function pgGetTarefaById(id: number): Promise<TarefaRow | undefined> {
  const { userId, cursoId } = requireTenant();
  const result = await getPostgresPool().query(
    `SELECT * FROM tarefas WHERE id = $1 AND user_id = $2 AND curso_id = $3 LIMIT 1`,
    [id, userId, cursoId]
  );
  const row = result.rows[0];
  return row ? mapTarefaRow(row) : undefined;
}

export interface UpdateTarefaFields {
  titulo?: string;
  descricao?: string;
  data_fim?: string | null;
  hora_fim?: string | null;
  tipo?: TarefaRow["tipo"];
  possui_nota?: number;
  concluida?: number;
  pontuacao_maxima?: number | null;
}

export async function pgUpdateTarefaFields(
  id: number,
  fields: UpdateTarefaFields
): Promise<number> {
  const entries: SetEntry[] = [];
  if (fields.titulo !== undefined) entries.push(["titulo", fields.titulo]);
  if (fields.descricao !== undefined) entries.push(["descricao", fields.descricao]);
  if (fields.data_fim !== undefined) entries.push(["data_fim", fields.data_fim]);
  if (fields.hora_fim !== undefined) entries.push(["hora_fim", fields.hora_fim]);
  if (fields.tipo !== undefined) entries.push(["tipo", fields.tipo]);
  if (fields.possui_nota !== undefined) entries.push(["possui_nota", fields.possui_nota]);
  if (fields.concluida !== undefined) entries.push(["concluida", fields.concluida]);
  if (fields.pontuacao_maxima !== undefined) entries.push(["pontuacao_maxima", fields.pontuacao_maxima]);
  if (entries.length === 0) return 0;

  const { userId, cursoId } = requireTenant();
  const { clause, params } = buildSetClause(entries, 1);
  const next = params.length + 1;
  const result = await getPostgresPool().query(
    `UPDATE tarefas SET ${clause}
     WHERE id = $${next} AND user_id = $${next + 1} AND curso_id = $${next + 2}`,
    [...params, id, userId, cursoId]
  );
  return result.rowCount ?? 0;
}

export async function pgUpdateTarefaConcluida(
  id: number,
  concluida: boolean
): Promise<number> {
  const { userId, cursoId } = requireTenant();
  const result = await getPostgresPool().query(
    `UPDATE tarefas SET concluida = $1, concluida_override = 1
     WHERE id = $2 AND user_id = $3 AND curso_id = $4`,
    [concluida ? 1 : 0, id, userId, cursoId]
  );
  return result.rowCount ?? 0;
}

export async function pgDeleteTarefa(id: number): Promise<number> {
  const { userId, cursoId } = requireTenant();
  const result = await getPostgresPool().query(
    `DELETE FROM tarefas WHERE id = $1 AND user_id = $2 AND curso_id = $3 AND manual = 1`,
    [id, userId, cursoId]
  );
  return result.rowCount ?? 0;
}

// --- SEMESTRE_ATUAL (aparência) ---
export interface UpdateAppearanceFields {
  cor?: string;
  apelido?: string | null;
  nome_exibicao?: string | null;
  local_exibicao?: string | null;
  horario_exibicao?: string | null;
  professor_exibicao?: string | null;
  horas_semanais_exibicao?: number | null;
}

export async function pgUpdateSemestreAtualAppearance(
  disciplinaId: string,
  fields: UpdateAppearanceFields
): Promise<number> {
  const entries: SetEntry[] = [];
  if (fields.cor !== undefined) entries.push(["cor", fields.cor]);
  if (fields.apelido !== undefined) entries.push(["apelido", fields.apelido]);
  if (fields.nome_exibicao !== undefined) entries.push(["nome_exibicao", fields.nome_exibicao]);
  if (fields.local_exibicao !== undefined) entries.push(["local_exibicao", fields.local_exibicao]);
  if (fields.horario_exibicao !== undefined) entries.push(["horario_exibicao", fields.horario_exibicao]);
  if (fields.professor_exibicao !== undefined) entries.push(["professor_exibicao", fields.professor_exibicao]);
  if (fields.horas_semanais_exibicao !== undefined) {
    entries.push(["horas_semanais_exibicao", fields.horas_semanais_exibicao]);
  }
  if (entries.length === 0) return 0;

  const { userId, cursoId } = requireTenant();
  const { clause, params } = buildSetClause(entries, 1);
  const next = params.length + 1;
  const result = await getPostgresPool().query(
    `UPDATE semestre_atual SET ${clause}
     WHERE LOWER(disciplina_id) = LOWER($${next})
       AND user_id = $${next + 1} AND curso_id = $${next + 2}`,
    [...params, disciplinaId, userId, cursoId]
  );
  return result.rowCount ?? 0;
}

// --- EVENTOS_CALENDARIO ---
export interface InsertEventoInput {
  titulo: string;
  descricao: string | null;
  data: string;
  data_fim: string | null;
  hora_inicio: string | null;
  hora_fim: string | null;
  recorrencia: EventoCalendarioRow["recorrencia"];
  recorrencia_ate: string | null;
  recorrencia_dias: string | null;
  tipo: EventoCalendarioRow["tipo"];
  disciplina_id: string | null;
  cor: string | null;
  concluida: number;
  manual: number;
}

export async function pgInsertEventoCalendario(
  input: InsertEventoInput
): Promise<number> {
  const { userId, cursoId } = requireTenant();
  const result = await getPostgresPool().query(
    `INSERT INTO eventos_calendario
       (user_id, curso_id, titulo, descricao, data, data_fim, hora_inicio,
        hora_fim, recorrencia, recorrencia_ate, recorrencia_dias, tipo,
        disciplina_id, cor, concluida, manual)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
     RETURNING id`,
    [
      userId,
      cursoId,
      input.titulo,
      input.descricao,
      input.data,
      input.data_fim,
      input.hora_inicio,
      input.hora_fim,
      input.recorrencia ?? "none",
      input.recorrencia_ate,
      input.recorrencia_dias,
      input.tipo,
      input.disciplina_id,
      input.cor,
      input.concluida,
      input.manual,
    ]
  );
  return Number(result.rows[0].id);
}

export interface UpdateEventoFields {
  titulo?: string;
  descricao?: string;
  data?: string;
  data_fim?: string | null;
  hora_inicio?: string | null;
  hora_fim?: string | null;
  recorrencia?: EventoCalendarioRow["recorrencia"];
  recorrencia_ate?: string | null;
  recorrencia_dias?: string | null;
  tipo?: EventoCalendarioRow["tipo"];
  disciplina_id?: string | null;
  cor?: string | null;
  concluida?: number;
}

export async function pgUpdateEventoCalendarioFields(
  id: number,
  fields: UpdateEventoFields
): Promise<number> {
  const entries: SetEntry[] = [];
  if (fields.titulo !== undefined) entries.push(["titulo", fields.titulo]);
  if (fields.descricao !== undefined) entries.push(["descricao", fields.descricao]);
  if (fields.data !== undefined) entries.push(["data", fields.data]);
  if (fields.data_fim !== undefined) entries.push(["data_fim", fields.data_fim]);
  if (fields.hora_inicio !== undefined) entries.push(["hora_inicio", fields.hora_inicio]);
  if (fields.hora_fim !== undefined) entries.push(["hora_fim", fields.hora_fim]);
  if (fields.recorrencia !== undefined) entries.push(["recorrencia", fields.recorrencia]);
  if (fields.recorrencia_ate !== undefined) entries.push(["recorrencia_ate", fields.recorrencia_ate]);
  if (fields.recorrencia_dias !== undefined) entries.push(["recorrencia_dias", fields.recorrencia_dias]);
  if (fields.tipo !== undefined) entries.push(["tipo", fields.tipo]);
  if (fields.disciplina_id !== undefined) entries.push(["disciplina_id", fields.disciplina_id]);
  if (fields.cor !== undefined) entries.push(["cor", fields.cor]);
  if (fields.concluida !== undefined) entries.push(["concluida", fields.concluida]);
  if (entries.length === 0) return 0;

  const { userId, cursoId } = requireTenant();
  const { clause, params } = buildSetClause(entries, 1);
  const next = params.length + 1;
  const result = await getPostgresPool().query(
    `UPDATE eventos_calendario SET ${clause}
     WHERE id = $${next} AND user_id = $${next + 1} AND curso_id = $${next + 2}`,
    [...params, id, userId, cursoId]
  );
  return result.rowCount ?? 0;
}

export async function pgDeleteEventoCalendario(id: number): Promise<number> {
  const { userId, cursoId } = requireTenant();
  const result = await getPostgresPool().query(
    `DELETE FROM eventos_calendario
     WHERE id = $1 AND user_id = $2 AND curso_id = $3 AND manual = 1`,
    [id, userId, cursoId]
  );
  return result.rowCount ?? 0;
}

export async function pgGetEventoCalendarioById(
  id: number
): Promise<EventoCalendarioRow | undefined> {
  const { userId, cursoId } = requireTenant();
  const result = await getPostgresPool().query(
    `SELECT e.*, d.nome AS disciplina_nome, s.apelido AS disciplina_apelido
     FROM eventos_calendario e
     LEFT JOIN disciplinas d
       ON d.curso_id = e.curso_id AND d.codigo = e.disciplina_id
     LEFT JOIN semestre_atual s
       ON s.user_id = e.user_id AND s.curso_id = e.curso_id
      AND s.disciplina_id = e.disciplina_id
     WHERE e.id = $1 AND e.user_id = $2 AND e.curso_id = $3
     LIMIT 1`,
    [id, userId, cursoId]
  );
  const row = result.rows[0];
  return row ? mapEventoCalendarioRow(row) : undefined;
}

async function queryTarefaCalendar(
  where: string,
  params: unknown[]
): Promise<TarefaCalendarRow | undefined> {
  const result = await getPostgresPool().query(
    `SELECT t.*, d.nome AS disciplina_nome, s.apelido AS disciplina_apelido,
            s.cor AS cor
     FROM tarefas t
     JOIN disciplinas d
       ON d.curso_id = t.curso_id AND d.codigo = t.disciplina_id
     LEFT JOIN semestre_atual s
       ON s.user_id = t.user_id AND s.curso_id = t.curso_id
      AND s.disciplina_id = t.disciplina_id
     WHERE ${where}
     ORDER BY t.id DESC
     LIMIT 1`,
    params
  );
  const row = result.rows[0];
  return row ? mapTarefaCalendarRow(row) : undefined;
}

export async function pgGetTarefaCalendarById(
  id: number
): Promise<TarefaCalendarRow | undefined> {
  const { userId, cursoId } = requireTenant();
  return queryTarefaCalendar(
    `t.id = $1 AND t.user_id = $2 AND t.curso_id = $3`,
    [id, userId, cursoId]
  );
}

export async function pgGetTarefaCalendarByDisciplinaLatest(
  disciplinaId: string
): Promise<TarefaCalendarRow | undefined> {
  const { userId, cursoId } = requireTenant();
  return queryTarefaCalendar(
    `LOWER(t.disciplina_id) = LOWER($1) AND t.user_id = $2 AND t.curso_id = $3`,
    [disciplinaId, userId, cursoId]
  );
}
