import type { GradeRisk, SubjectEvaluation } from "@acme/api-contracts";

const PASSING = 60;
const GRADE_MAX = 100;
const RECOVERY = 40;

function nonExtra(evaluations: SubjectEvaluation[]) {
  return evaluations.filter((ev) => !ev.extra);
}

function roundTotal(value: number): number {
  return Math.round(value * 10) / 10;
}

function currentTotal(evaluations: SubjectEvaluation[], grade: number | null): number {
  const rows = nonExtra(evaluations);
  const fromEv = rows.reduce((acc, ev) => acc + (ev.score ?? 0), 0);
  if (rows.some((ev) => ev.score !== null)) return roundTotal(fromEv);
  return grade ?? 0;
}

function remainingMax(evaluations: SubjectEvaluation[]): number {
  return nonExtra(evaluations)
    .filter((ev) => ev.score === null)
    .reduce((acc, ev) => acc + ev.max, 0);
}

function fullyDistributed(evaluations: SubjectEvaluation[], gradeMax: number): boolean {
  const rows = nonExtra(evaluations);
  if (rows.length === 0) return false;
  const allGraded = rows.every((ev) => ev.score !== null);
  const distributed = rows.reduce((acc, ev) => acc + ev.max, 0);
  return allGraded && distributed >= gradeMax;
}

/** Espelho enxuto de computeGradeRisk (web) para simulacao local no mobile. */
export function computeGradeRiskLite(params: {
  evaluations: SubjectEvaluation[];
  passingGrade?: number;
  gradeMax?: number;
  grade: number | null;
}): GradeRisk {
  const passingGrade = params.passingGrade ?? PASSING;
  const gradeMax = params.gradeMax ?? GRADE_MAX;
  const { evaluations, grade } = params;
  const rows = nonExtra(evaluations);
  const hasAny = grade !== null || rows.some((ev) => ev.score !== null);
  const total = currentTotal(evaluations, grade);
  const remaining = remainingMax(evaluations);
  const full = fullyDistributed(evaluations, gradeMax);
  const pointsNeeded = Math.max(0, passingGrade - total);
  const passingProgress =
    passingGrade > 0
      ? Math.min(100, Math.round((total / passingGrade) * 1000) / 10)
      : 0;
  const base = {
    passingGrade,
    currentTotal: total,
    passingProgress,
    remainingMax: remaining,
    fullyDistributed: full,
    pointsNeeded,
  };

  if (evaluations.length === 0 || !hasAny) {
    return {
      ...base,
      zone: "unknown",
      label: "Sem notas",
      pointsNeeded: passingGrade,
      canStillPass: remaining >= passingGrade,
    };
  }
  if (total >= passingGrade) {
    return { ...base, zone: "safe", label: "Aprovado", pointsNeeded: 0, canStillPass: true };
  }
  if (full) {
    if (total >= RECOVERY) {
      return { ...base, zone: "warning", label: "Recuperacao", canStillPass: true };
    }
    return { ...base, zone: "danger", label: "Reprovado", canStillPass: false };
  }
  const canStillPass = pointsNeeded <= remaining;
  if (!canStillPass || remaining === 0) {
    return { ...base, zone: "danger", label: "Critico", canStillPass: false };
  }
  const pressure = pointsNeeded / remaining;
  if (pressure >= 0.6) {
    return { ...base, zone: "danger", label: "Critico", canStillPass: true };
  }
  if (pressure >= 0.3) {
    return { ...base, zone: "warning", label: "Risco", canStillPass: true };
  }
  return { ...base, zone: "safe", label: "No caminho", canStillPass: true };
}

export function parseScoreInput(value: string): number | null {
  const trimmed = value.trim().replace(",", ".");
  if (!trimmed || trimmed === ".") return null;
  const parsed = Number.parseFloat(trimmed);
  return Number.isNaN(parsed) ? null : parsed;
}
