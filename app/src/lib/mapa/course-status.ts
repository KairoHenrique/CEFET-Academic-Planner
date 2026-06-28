import type { HistoricoRow, RequisitoRow } from "@/lib/types/db";
import type { CourseMapStatus } from "@/lib/types/mapa-api";

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

export function buildCurrentDisciplinaSet(codes: string[]): Set<string> {
  return new Set(codes.map(normalizeCode));
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

function arePreRequisitosMet(
  disciplinaId: string,
  preRequisitos: Map<string, string[]>,
  completed: Set<string>
): boolean {
  const required = preRequisitos.get(normalizeCode(disciplinaId)) ?? [];
  return required.every((code) => completed.has(code));
}

export function resolveCourseMapStatus(
  disciplinaId: string,
  current: Set<string>,
  completed: Set<string>,
  preRequisitos: Map<string, string[]>
): CourseMapStatus {
  const code = normalizeCode(disciplinaId);

  if (current.has(code)) return "current";
  if (completed.has(code)) return "done";
  if (!arePreRequisitosMet(code, preRequisitos, completed)) return "locked";
  return "unlocked";
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
