import type { HistoricoRow, RequisitoRow } from "@/lib/types/db";
import type { DisciplinaRow } from "@/lib/types/db";
import type { CourseMapStatus } from "@/lib/types/mapa-api";
import { evaluateChGateForDisciplina } from "@/lib/mapa/period-ch-gates";

const DONE_STATUS_KEYWORDS = [
  "aprov",
  "conclu",
  "dispens",
  "equival",
  "aproveit",
] as const;

function normalizeCode(code: string): string {
  return code.trim().toUpperCase();
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
  const cursando = new Set<string>();

  for (const row of historico) {
    if (isHistoricoCursando(row)) {
      cursando.add(normalizeCode(row.disciplina_id));
    }
  }

  return cursando;
}

export function buildCurrentDisciplinaSet(codes: string[]): Set<string> {
  return new Set(codes.map(normalizeCode));
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

  if (context.current.has(code)) {
    return { status: "current" };
  }

  if (context.completed.has(code)) {
    return { status: "done" };
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
