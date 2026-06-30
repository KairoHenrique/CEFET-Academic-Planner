import type { SubjectEvaluation } from "@/lib/types/subject";
import type { GradeRisk, GradeRiskZone } from "@/lib/types/grade-risk";
import {
  SUBJECT_DISPLAY_GRADE_MAX,
  SUBJECT_DISPLAY_PASSING_GRADE,
  SUBJECT_RECOVERY_GRADE,
} from "@/lib/disciplinas/grade-display";
import { roundFinalGradeTotal } from "@/lib/disciplinas/grade-rounding";

export type { GradeRisk, GradeRiskZone };

function nonExtraEvaluations(evaluations: SubjectEvaluation[]) {
  return evaluations.filter((ev) => !ev.extra);
}

/** Soma o máximo das avaliações em que o aluno já tem nota (manual ou SIGAA). */
function gradedPointsMax(evaluations: SubjectEvaluation[]): number {
  return nonExtraEvaluations(evaluations)
    .filter((ev) => ev.score !== null)
    .reduce((acc, ev) => acc + ev.max, 0);
}

export function computePendingTeacherPoints(
  evaluations: SubjectEvaluation[],
  gradeMax: number = SUBJECT_DISPLAY_GRADE_MAX
): number {
  return Math.max(0, gradeMax - gradedPointsMax(evaluations));
}

function computeCurrentTotal(
  evaluations: SubjectEvaluation[],
  grade: number | null
): number {
  const nonExtra = nonExtraEvaluations(evaluations);
  const fromEvaluations = nonExtra.reduce(
    (acc, ev) => acc + (ev.score ?? 0),
    0
  );
  const hasScore = nonExtra.some((ev) => ev.score !== null);
  if (hasScore) return roundFinalGradeTotal(fromEvaluations);
  return grade ?? 0;
}

export function computeDistributedMax(evaluations: SubjectEvaluation[]): number {
  return nonExtraEvaluations(evaluations).reduce((acc, ev) => acc + ev.max, 0);
}

/** Pontos ainda disponíveis para definir nota máxima (exclui extras). */
export function computeRemainingDistributionBudget(
  evaluations: SubjectEvaluation[],
  gradeMax: number = SUBJECT_DISPLAY_GRADE_MAX,
  options?: { excludeEvaluationId?: number }
): number {
  const excludeId = options?.excludeEvaluationId;
  const allocated = nonExtraEvaluations(evaluations)
    .filter((ev) => ev.id !== excludeId)
    .reduce((acc, ev) => acc + ev.max, 0);

  return Math.max(0, gradeMax - allocated);
}

function distributedMax(evaluations: SubjectEvaluation[]): number {
  return computeDistributedMax(evaluations);
}

/** Pontos ainda recuperáveis só entre avaliações já cadastradas pelo professor. */
function remainingDistributedMax(evaluations: SubjectEvaluation[]): number {
  return nonExtraEvaluations(evaluations)
    .filter((ev) => ev.score === null)
    .reduce((acc, ev) => acc + ev.max, 0);
}

function isFullyDistributed(
  evaluations: SubjectEvaluation[],
  gradeMax: number
): boolean {
  const nonExtra = nonExtraEvaluations(evaluations);
  if (nonExtra.length === 0) return false;

  const allGraded = nonExtra.every((ev) => ev.score !== null);
  const structureCoversMax = distributedMax(evaluations) >= gradeMax;

  return allGraded && structureCoversMax;
}

export function computeGradeRisk(params: {
  evaluations: SubjectEvaluation[];
  passingGrade?: number;
  gradeMax?: number;
  recoveryGrade?: number;
  grade: number | null;
  absences?: number;
  maxAbsences?: number;
}): GradeRisk {
  const {
    evaluations,
    passingGrade = SUBJECT_DISPLAY_PASSING_GRADE,
    gradeMax = SUBJECT_DISPLAY_GRADE_MAX,
    recoveryGrade = SUBJECT_RECOVERY_GRADE,
    grade,
    absences = 0,
    maxAbsences = 0,
  } = params;

  const nonExtra = nonExtraEvaluations(evaluations);
  const hasAnyScore =
    grade !== null || nonExtra.some((ev) => ev.score !== null);
  const currentTotal = computeCurrentTotal(evaluations, grade);
  const distributedRemaining = remainingDistributedMax(evaluations);
  const fullyDistributed = isFullyDistributed(evaluations, gradeMax);
  const pointsNeeded = Math.max(0, passingGrade - currentTotal);
  const passingProgress =
    passingGrade > 0
      ? Math.min(100, Math.round((currentTotal / passingGrade) * 1000) / 10)
      : 0;

  const base = {
    passingGrade,
    currentTotal,
    passingProgress,
    remainingMax: distributedRemaining,
    fullyDistributed,
  };

  if (maxAbsences > 0 && absences > maxAbsences) {
    return {
      ...base,
      zone: "danger",
      label: "Reprovado por falta",
      pointsNeeded,
      canStillPass: false,
    };
  }

  if (evaluations.length === 0 || !hasAnyScore) {
    return {
      ...base,
      zone: "unknown",
      label: "Sem notas",
      pointsNeeded: passingGrade,
      canStillPass: distributedRemaining >= passingGrade,
    };
  }

  if (currentTotal >= passingGrade) {
    return {
      ...base,
      zone: "safe",
      label: "Aprovado",
      pointsNeeded: 0,
      canStillPass: true,
    };
  }

  if (fullyDistributed) {
    if (currentTotal >= recoveryGrade) {
      return {
        ...base,
        zone: "warning",
        label: "Recuperação",
        pointsNeeded,
        canStillPass: true,
      };
    }

    return {
      ...base,
      zone: "danger",
      label: "Reprovado",
      pointsNeeded,
      canStillPass: false,
    };
  }

  const canStillPass = pointsNeeded <= distributedRemaining;

  if (!canStillPass || distributedRemaining === 0) {
    return {
      ...base,
      zone: "danger",
      label: "Crítico",
      pointsNeeded,
      canStillPass: false,
    };
  }

  const pressure = pointsNeeded / distributedRemaining;

  if (pressure >= 0.6) {
    return {
      ...base,
      zone: "danger",
      label: "Crítico",
      pointsNeeded,
      canStillPass: true,
    };
  }

  if (pressure >= 0.3) {
    return {
      ...base,
      zone: "warning",
      label: "Risco",
      pointsNeeded,
      canStillPass: true,
    };
  }

  return {
    ...base,
    zone: "safe",
    label: "No caminho",
    pointsNeeded,
    canStillPass: true,
  };
}
