"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import type { SubjectEvaluation } from "@/lib/types/subject";
import type { GradeRisk } from "@/lib/types/grade-risk";
import {
  computeGradeRisk,
  computePendingTeacherPoints,
  computeRemainingDistributionBudget,
} from "@/lib/disciplinas/grade-risk";
import { parseScoreInput } from "@/lib/disciplinas/grade-input";

/** Linha de trabalho da simulação: avaliação real ou criada durante o "Simular". */
export interface SimEvaluationRow extends SubjectEvaluation {
  simKey: string;
  ephemeral: boolean;
}

interface UseGradeSimulationOptions {
  evaluations: SubjectEvaluation[];
  passingGrade: number;
  gradeMax: number;
}

/**
 * Simulação de notas 100% efêmera. Ao entrar, tira um snapshot das avaliações
 * reais; edições de nota e criação de avaliações vivem apenas em estado local e
 * são descartadas ao sair (nada persiste no servidor). A nota total, a barra e o
 * status derivam ao vivo do conjunto de trabalho via `computeGradeRisk`.
 */
export function useGradeSimulation({
  evaluations,
  passingGrade,
  gradeMax,
}: UseGradeSimulationOptions) {
  const [simulateMode, setSimulateMode] = useState(false);
  const [simRows, setSimRows] = useState<SimEvaluationRow[]>([]);
  const [simScores, setSimScores] = useState<Record<string, string>>({});
  const ephemeralCounter = useRef(0);

  const snapshotFromEvaluations = useCallback((): {
    rows: SimEvaluationRow[];
    scores: Record<string, string>;
  } => {
    const rows: SimEvaluationRow[] = [];
    const scores: Record<string, string> = {};
    evaluations.forEach((ev, index) => {
      const simKey = ev.id !== undefined ? `real-${ev.id}` : `real-i${index}`;
      rows.push({ ...ev, simKey, ephemeral: false });
      if (ev.score !== null) scores[simKey] = String(ev.score);
    });
    return { rows, scores };
  }, [evaluations]);

  const enterSimulation = useCallback(() => {
    const { rows, scores } = snapshotFromEvaluations();
    ephemeralCounter.current = 0;
    setSimRows(rows);
    setSimScores(scores);
    setSimulateMode(true);
  }, [snapshotFromEvaluations]);

  const exitSimulation = useCallback(() => {
    setSimulateMode(false);
    setSimRows([]);
    setSimScores({});
  }, []);

  const handleReset = useCallback(() => {
    const { rows, scores } = snapshotFromEvaluations();
    ephemeralCounter.current = 0;
    setSimRows(rows);
    setSimScores(scores);
  }, [snapshotFromEvaluations]);

  const setSimScore = useCallback((simKey: string, value: string) => {
    setSimScores((prev) => ({ ...prev, [simKey]: value }));
  }, []);

  const addSimEvaluation = useCallback(
    (evaluation: { name: string; max: number; extra: boolean }) => {
      ephemeralCounter.current += 1;
      setSimRows((prev) => [
        ...prev,
        {
          simKey: `sim-${ephemeralCounter.current}`,
          name: evaluation.name,
          max: evaluation.max,
          score: null,
          manual: true,
          extra: evaluation.extra,
          ephemeral: true,
        },
      ]);
    },
    []
  );

  const removeSimEvaluation = useCallback((simKey: string) => {
    setSimRows((prev) => prev.filter((row) => row.simKey !== simKey));
    setSimScores((prev) => {
      const next = { ...prev };
      delete next[simKey];
      return next;
    });
  }, []);

  const resolvedScore = useCallback(
    (row: SimEvaluationRow): number | null => {
      const raw = simScores[row.simKey];
      if (raw === undefined || raw === "") return row.score;
      return parseScoreInput(raw) ?? row.score;
    },
    [simScores]
  );

  const workingEvaluations = useMemo<SubjectEvaluation[]>(
    () =>
      simRows.map((row) => ({
        id: row.id,
        name: row.name,
        max: row.max,
        score: resolvedScore(row),
        manual: row.manual,
        extra: row.extra,
      })),
    [simRows, resolvedScore]
  );

  const simGradeRisk = useMemo<GradeRisk>(
    () =>
      computeGradeRisk({
        evaluations: workingEvaluations,
        passingGrade,
        gradeMax,
        grade: null,
      }),
    [workingEvaluations, passingGrade, gradeMax]
  );

  const simDistributionBudget = useMemo(
    () => computeRemainingDistributionBudget(workingEvaluations, gradeMax),
    [workingEvaluations, gradeMax]
  );

  const getSimMinimum = useCallback(
    (simKey: string): number | null => {
      const index = simRows.findIndex((row) => row.simKey === simKey);
      if (index < 0 || simRows[index].extra) return null;

      const othersTotal = simRows.reduce<number>((acc, row, idx) => {
        if (idx === index || row.extra) return acc;
        return acc + (resolvedScore(row) ?? 0);
      }, 0);

      return Math.min(
        simRows[index].max,
        Math.max(0, passingGrade - othersTotal)
      );
    },
    [simRows, resolvedScore, passingGrade]
  );

  const pendingTeacherPoints = useMemo(
    () => computePendingTeacherPoints(evaluations, gradeMax),
    [evaluations, gradeMax]
  );

  return {
    simulateMode,
    enterSimulation,
    exitSimulation,
    handleReset,
    simRows,
    simScores,
    setSimScore,
    addSimEvaluation,
    removeSimEvaluation,
    resolvedScore,
    workingEvaluations,
    simGradeRisk,
    simulatedTotal: simGradeRisk.currentTotal,
    approved: simGradeRisk.currentTotal >= passingGrade,
    pointsNeeded: simGradeRisk.pointsNeeded,
    simDistributionBudget,
    getSimMinimum,
    pendingTeacherPoints,
  };
}
