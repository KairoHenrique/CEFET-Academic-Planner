import type { HistoricoRow, NotaRow, RequisitoRow } from "@/lib/types/db";
import type { DisciplinaRow } from "@/lib/types/db";
import type { CourseMapStatus } from "@/lib/types/mapa-api";
import { computeGradeFromNotas } from "@/lib/disciplinas/grade";
import { SUBJECT_DISPLAY_PASSING_GRADE } from "@/lib/disciplinas/grade-display";
import { evaluateChGateForDisciplina } from "@/lib/mapa/period-ch-gates";

const DONE_STATUS_KEYWORDS = [
  "aprov",
  "conclu",
  "dispens",
  "equival",
  "aproveit",
] as const;

export function normalizeDisciplinaCode(code: string): string {
  return code.trim().toUpperCase();
}

function normalizeCode(code: string): string {
  return normalizeDisciplinaCode(code);
}

export function isHistoricoApproved(row: HistoricoRow): boolean {
  const status = row.status?.trim().toLowerCase() ?? "";
  if (!status) {
    return row.nota_final !== null && row.nota_final >= 60;
  }

  if (status.includes("reprov") || status.includes("tranc") || status.includes("cancel")) {
    return false;
  }

  return DONE_STATUS_KEYWORDS.some((keyword) => status.includes(keyword));
}

export function isHistoricoCursando(row: HistoricoRow): boolean {
  const status = row.status?.trim().toLowerCase() ?? "";
  return (
    status.includes("cursando") ||
    status.includes("matriculado") ||
    status === "matr"
  );
}

export function isHistoricoFailed(row: HistoricoRow): boolean {
  const status = row.status?.trim().toLowerCase() ?? "";
  if (!status) return false;
  return status.includes("reprov");
}

export function parseHistoricoSemestre(raw: string): [number, number] | null {
  const match = raw.trim().match(/(\d{4})[./-](\d)/);
  if (!match) return null;
  return [Number(match[1]), Number(match[2])];
}

export function compareHistoricoSemestre(left: string, right: string): number {
  const parsedLeft = parseHistoricoSemestre(left);
  const parsedRight = parseHistoricoSemestre(right);
  if (!parsedLeft && !parsedRight) return 0;
  if (!parsedLeft) return -1;
  if (!parsedRight) return 1;
  if (parsedLeft[0] !== parsedRight[0]) return parsedLeft[0] - parsedRight[0];
  return parsedLeft[1] - parsedRight[1];
}

/** Disciplinas cuja tentativa mais recente no histórico é reprovação. */
export function buildFailedDisciplinaSet(
  historico: HistoricoRow[]
): Set<string> {
  const latestByCode = new Map<string, HistoricoRow>();

  for (const row of historico) {
    const code = normalizeCode(row.disciplina_id);
    const existing = latestByCode.get(code);
    if (
      !existing ||
      compareHistoricoSemestre(row.semestre, existing.semestre) > 0
    ) {
      latestByCode.set(code, row);
    }
  }

  const failed = new Set<string>();
  for (const [code, row] of latestByCode) {
    if (isHistoricoFailed(row) && !isHistoricoApproved(row)) {
      failed.add(code);
    }
  }

  return failed;
}

export function buildCompletedDisciplinaSet(
  historico: HistoricoRow[]
): Set<string> {
  const completed = new Set<string>();

  for (const row of historico) {
    if (isHistoricoApproved(row)) {
      completed.add(normalizeCode(row.disciplina_id));
    }
  }

  return completed;
}

export function buildCursandoDisciplinaSet(
  historico: HistoricoRow[]
): Set<string> {
  // Só a tentativa mais recente conta — histórico antigo com MATR não
  // mantém "cursando" depois de uma aprovação posterior.
  const latestByCode = new Map<string, HistoricoRow>();

  for (const row of historico) {
    const code = normalizeCode(row.disciplina_id);
    const existing = latestByCode.get(code);
    if (
      !existing ||
      compareHistoricoSemestre(row.semestre, existing.semestre) > 0
    ) {
      latestByCode.set(code, row);
    }
  }

  const cursando = new Set<string>();
  for (const [code, row] of latestByCode) {
    if (isHistoricoCursando(row) && !isHistoricoApproved(row)) {
      cursando.add(code);
    }
  }

  return cursando;
}

export function buildCurrentDisciplinaSet(codes: string[]): Set<string> {
  return new Set(codes.map(normalizeCode));
}

/**
 * Fonte de "cursando" no mapa / elegibilidade:
 * - o que está no `semestre_atual` (portal) sempre conta;
 * - MATR residual do PDF só conta se ainda houver semestre no portal.
 * Férias / "Nenhuma turma neste semestre" → ignora MATR órfão (evita "1 CURSANDO").
 */
export function buildActiveCurrentDisciplinaSet(
  semestreAtualCodes: string[],
  historico: HistoricoRow[]
): Set<string> {
  const fromPortal = buildCurrentDisciplinaSet(semestreAtualCodes);
  const fromHistoricoMatr =
    semestreAtualCodes.length === 0
      ? new Set<string>()
      : buildCursandoDisciplinaSet(historico);

  const current = mergeDisciplinaSets(fromPortal, fromHistoricoMatr);
  for (const code of buildCompletedDisciplinaSet(historico)) {
    current.delete(code);
  }
  return current;
}

/** Totais por disciplina (código normalizado) a partir das notas sincronizadas. */
export function buildGradeTotalsByDisciplinaCode(
  notas: NotaRow[]
): Map<string, number | null> {
  const byCode = new Map<string, NotaRow[]>();

  for (const nota of notas) {
    const code = normalizeDisciplinaCode(nota.disciplina_id);
    if (!code) continue;
    const bucket = byCode.get(code) ?? [];
    bucket.push(nota);
    byCode.set(code, bucket);
  }

  const totals = new Map<string, number | null>();
  for (const [code, rows] of byCode) {
    totals.set(code, computeGradeFromNotas(rows));
  }
  return totals;
}

/**
 * Fecha MATR órfão no mapa: sem turma no portal + notas ≥ aprovação
 * (mesmo critério do dashboard) → conta como concluída.
 */
export function mergeCompletedWithClosedSemesterGrades(input: {
  historico: HistoricoRow[];
  semestreAtualCodes: string[];
  gradeTotalsByCode: ReadonlyMap<string, number | null>;
  passingGrade?: number;
}): Set<string> {
  const completed = buildCompletedDisciplinaSet(input.historico);
  const failed = buildFailedDisciplinaSet(input.historico);
  const enrolled = buildCurrentDisciplinaSet(input.semestreAtualCodes);
  const orphanMatr = buildCursandoDisciplinaSet(input.historico);
  const passing = input.passingGrade ?? SUBJECT_DISPLAY_PASSING_GRADE;

  for (const code of orphanMatr) {
    if (enrolled.has(code) || failed.has(code) || completed.has(code)) continue;
    const total = input.gradeTotalsByCode.get(code) ?? null;
    if (total != null && total >= passing) {
      completed.add(code);
    }
  }

  return completed;
}

export function mergeDisciplinaSets(...sets: Set<string>[]): Set<string> {
  const merged = new Set<string>();
  for (const set of sets) {
    for (const code of set) {
      merged.add(code);
    }
  }
  return merged;
}

export function buildPreRequisitoMap(
  requisitos: RequisitoRow[]
): Map<string, string[]> {
  const map = new Map<string, string[]>();

  for (const row of requisitos) {
    if (row.tipo !== "pre") continue;

    const disciplinaId = normalizeCode(row.disciplina_id);
    const bucket = map.get(disciplinaId) ?? [];
    bucket.push(normalizeCode(row.requisito_id));
    map.set(disciplinaId, bucket);
  }

  return map;
}

export function buildCoRequisitoMap(
  requisitos: RequisitoRow[]
): Map<string, string[]> {
  const map = new Map<string, string[]>();

  for (const row of requisitos) {
    if (row.tipo !== "co") continue;

    const disciplinaId = normalizeCode(row.disciplina_id);
    const bucket = map.get(disciplinaId) ?? [];
    bucket.push(normalizeCode(row.requisito_id));
    map.set(disciplinaId, bucket);
  }

  return map;
}

export interface CourseMapStatusContext {
  disciplina: DisciplinaRow;
  current: Set<string>;
  completed: Set<string>;
  preRequisitos: Map<string, string[]>;
  obrigatoriaDone: number;
  obrigatoriaTotal: number;
  allDisciplinas: DisciplinaRow[];
}

export interface CourseMapStatusResult {
  status: CourseMapStatus;
  blockedBy?: "prereq" | "ch";
  chRemaining?: number;
}

function arePreRequisitosMet(
  disciplinaId: string,
  preRequisitos: Map<string, string[]>,
  completed: Set<string>
): boolean {
  const required = preRequisitos.get(normalizeCode(disciplinaId)) ?? [];
  return required.every((code) => completed.has(code));
}

export function resolveCourseMapStatusResult(
  context: CourseMapStatusContext
): CourseMapStatusResult {
  const code = normalizeCode(context.disciplina.codigo);

  // Aprovado/concluído vence "cursando" (semestre_atual / MATR residual).
  if (context.completed.has(code)) {
    return { status: "done" };
  }

  if (context.current.has(code)) {
    return { status: "current" };
  }

  if (!arePreRequisitosMet(code, context.preRequisitos, context.completed)) {
    return { status: "locked", blockedBy: "prereq" };
  }

  const chGate = evaluateChGateForDisciplina(
    context.disciplina,
    context.obrigatoriaDone,
    context.obrigatoriaTotal
  );

  if (!chGate.allowed) {
    return {
      status: "locked",
      blockedBy: "ch",
      chRemaining: chGate.chRemaining,
    };
  }

  return { status: "unlocked" };
}

/** @deprecated Prefer `resolveCourseMapStatusResult` com contexto de CH. */
export function resolveCourseMapStatus(
  disciplinaId: string,
  current: Set<string>,
  completed: Set<string>,
  preRequisitos: Map<string, string[]>
): CourseMapStatus {
  return resolveCourseMapStatusResult({
    disciplina: {
      codigo: disciplinaId,
      nome: "",
      tipo: "Obrigatória",
      carga_horaria: 0,
      periodo: null,
      ementa: null,
    },
    current,
    completed,
    preRequisitos,
    obrigatoriaDone: Number.MAX_SAFE_INTEGER,
    obrigatoriaTotal: 0,
    allDisciplinas: [],
  }).status;
}

export function countStatusTotals(
  statuses: CourseMapStatus[]
): Record<CourseMapStatus, number> {
  return statuses.reduce(
    (acc, status) => {
      acc[status] += 1;
      return acc;
    },
    { done: 0, current: 0, unlocked: 0, locked: 0 }
  );
}
