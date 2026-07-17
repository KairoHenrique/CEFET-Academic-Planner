import {
  buildSubjectListItemCore,
  buildSubjectSummaryCore,
  type SubjectSourceData,
} from "@/lib/disciplinas/build-subject";
import type {
  FaltaRow,
  NotaRow,
  SemestreAtualWithDisciplina,
  TarefaRow,
} from "@/lib/types/db";
import type { SubjectListItem } from "@/lib/types/disciplinas-api";
import type { SubjectSummary } from "@/lib/types/subject";

function normalizeCode(disciplinaId: string): string {
  return disciplinaId.toLowerCase();
}

function countFaltas(faltas: FaltaRow[]): number {
  return faltas.reduce((sum, falta) => {
    if (falta.status !== "falta") return sum;
    const quantidade = falta.quantidade ?? 0;
    return sum + (quantidade > 0 ? quantidade : 1);
  }, 0);
}

/** Total de faltas (regra do SQLite `countFaltasByDisciplina`) a partir de linhas. */
export function countFaltasFromRows(faltas: FaltaRow[]): number {
  return countFaltas(faltas);
}

/** Deriva a fonte por disciplina a partir de linhas já carregadas (qualquer backend). */
export function resolveSubjectSourceFromRows(
  notas: NotaRow[],
  faltas: FaltaRow[],
  tarefas: TarefaRow[]
): SubjectSourceData {
  return {
    notas,
    absences: countFaltas(faltas),
    tarefasPendentes: tarefas.filter((tarefa) => tarefa.concluida === 0).length,
  };
}

function groupBy<T>(
  rows: T[],
  getCode: (row: T) => string
): Map<string, T[]> {
  const grouped = new Map<string, T[]>();
  for (const row of rows) {
    const key = normalizeCode(getCode(row));
    const bucket = grouped.get(key) ?? [];
    bucket.push(row);
    grouped.set(key, bucket);
  }
  return grouped;
}

/**
 * Indexa notas/faltas/tarefas por disciplina uma única vez, expondo um leitor
 * O(1) por disciplina. Substitui as consultas SQLite por-disciplina no cloud.
 */
export class SubjectSourceIndex {
  private readonly notasByDisc: Map<string, NotaRow[]>;
  private readonly faltasByDisc: Map<string, FaltaRow[]>;
  private readonly pendentesByDisc: Map<string, number>;

  constructor(notas: NotaRow[], faltas: FaltaRow[], tarefas: TarefaRow[]) {
    this.notasByDisc = groupBy(notas, (row) => row.disciplina_id);
    this.faltasByDisc = groupBy(faltas, (row) => row.disciplina_id);

    this.pendentesByDisc = new Map();
    for (const tarefa of tarefas) {
      if (tarefa.concluida === 0) {
        const key = normalizeCode(tarefa.disciplina_id);
        this.pendentesByDisc.set(key, (this.pendentesByDisc.get(key) ?? 0) + 1);
      }
    }
  }

  resolve(disciplinaId: string): SubjectSourceData {
    const key = normalizeCode(disciplinaId);
    return {
      notas: this.notasByDisc.get(key) ?? [],
      absences: countFaltas(this.faltasByDisc.get(key) ?? []),
      tarefasPendentes: this.pendentesByDisc.get(key) ?? 0,
    };
  }
}

export interface SubjectBulkQueryDeps {
  getSemestreAtual: () => Promise<SemestreAtualWithDisciplina[]>;
  getAllNotas: () => Promise<NotaRow[]>;
  getAllFaltas: () => Promise<FaltaRow[]>;
  getTarefas: () => Promise<TarefaRow[]>;
}

async function loadIndex(
  deps: SubjectBulkQueryDeps
): Promise<{ semestreRows: SemestreAtualWithDisciplina[]; index: SubjectSourceIndex }> {
  const [semestreRows, notas, faltas, tarefas] = await Promise.all([
    deps.getSemestreAtual(),
    deps.getAllNotas(),
    deps.getAllFaltas(),
    deps.getTarefas(),
  ]);

  return { semestreRows, index: new SubjectSourceIndex(notas, faltas, tarefas) };
}

export async function buildSubjectSummariesFromQueries(
  deps: SubjectBulkQueryDeps
): Promise<SubjectSummary[]> {
  const { semestreRows, index } = await loadIndex(deps);
  return semestreRows.map((semestre) =>
    buildSubjectSummaryCore(semestre, index.resolve(semestre.disciplina_id))
  );
}

export async function buildSubjectListItemsFromQueries(
  deps: SubjectBulkQueryDeps
): Promise<SubjectListItem[]> {
  const { semestreRows, index } = await loadIndex(deps);
  return semestreRows.map((semestre) =>
    buildSubjectListItemCore(semestre, index.resolve(semestre.disciplina_id))
  );
}
