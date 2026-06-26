import type { GradeRisk } from "@/lib/types/grade-risk";
import { SUBJECT_DISPLAY_PASSING_GRADE } from "@/lib/disciplinas/grade-display";

export function requiredRecoveryScore(
  semesterTotal: number,
  passingGrade: number = SUBJECT_DISPLAY_PASSING_GRADE
): number {
  return Math.max(0, Math.round((passingGrade * 2 - semesterTotal) * 10) / 10);
}

export function recoverySemesterAverage(
  semesterTotal: number,
  recoveryScore: number
): number {
  return Math.round(((semesterTotal + recoveryScore) / 2) * 10) / 10;
}

export function applyRecoveryOutcome(
  base: GradeRisk,
  recoveryScore: number | null | undefined
): GradeRisk {
  if (base.label !== "Recuperação") {
    return base;
  }

  const recoveryScoreNeeded = requiredRecoveryScore(
    base.currentTotal,
    base.passingGrade
  );

  if (recoveryScore === null || recoveryScore === undefined) {
    return {
      ...base,
      recoveryScoreNeeded,
      awaitingRecovery: true,
    };
  }

  const recoveryAverage = recoverySemesterAverage(
    base.currentTotal,
    recoveryScore
  );

  if (recoveryAverage >= base.passingGrade) {
    return {
      ...base,
      zone: "safe",
      label: "Aprovado",
      pointsNeeded: 0,
      canStillPass: true,
      recoveryScore,
      recoveryAverage,
      recoveryScoreNeeded,
      awaitingRecovery: false,
    };
  }

  return {
    ...base,
    zone: "danger",
    label: "Reprovado",
    pointsNeeded: Math.max(0, base.passingGrade - recoveryAverage),
    canStillPass: false,
    recoveryScore,
    recoveryAverage,
    recoveryScoreNeeded,
    awaitingRecovery: false,
  };
}
