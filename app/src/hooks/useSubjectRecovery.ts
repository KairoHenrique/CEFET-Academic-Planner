"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { applyRecoveryOutcome } from "@/lib/disciplinas/recovery";
import type { GradeRisk } from "@/lib/types/grade-risk";
import {
  getRecoveryScore,
  loadRecoveryScores,
  saveRecoveryScore,
  subscribeRecoveryScores,
} from "@/lib/recovery/storage";

export function useSubjectRecovery(subjectCode: string, baseRisk: GradeRisk) {
  const map = useSyncExternalStore(
    subscribeRecoveryScores,
    loadRecoveryScores,
    () => EMPTY_MAP
  );

  const recoveryScore = getRecoveryScore(map, subjectCode);

  const gradeRisk = useMemo(
    () => applyRecoveryOutcome(baseRisk, recoveryScore),
    [baseRisk, recoveryScore]
  );

  const setRecoveryScore = useCallback(
    (score: number | null) => {
      saveRecoveryScore(subjectCode, score);
    },
    [subjectCode]
  );

  return {
    gradeRisk,
    recoveryScore,
    setRecoveryScore,
    recoveryScoreNeeded: gradeRisk.recoveryScoreNeeded ?? null,
  };
}

const EMPTY_MAP: Record<string, number> = {};
