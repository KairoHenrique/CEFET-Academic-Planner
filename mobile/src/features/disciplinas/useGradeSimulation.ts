import { useCallback, useMemo, useRef, useState } from "react";
import type { GradeRisk, SubjectEvaluation } from "@acme/api-contracts";
import {
  computeGradeRiskLite,
  parseScoreInput,
} from "./compute-grade-risk-lite";

export type SimEvaluationRow = SubjectEvaluation & {
  simKey: string;
  ephemeral: boolean;
};

/**
 * Simulacao efemera (igual web): nao grava no servidor/SIGAA.
 */
export function useGradeSimulation(options: {
  evaluations: SubjectEvaluation[];
  passingGrade: number;
  gradeMax: number;
}) {
  const { evaluations, passingGrade, gradeMax } = options;
  const [simulateMode, setSimulateMode] = useState(false);
  const [simRows, setSimRows] = useState<SimEvaluationRow[]>([]);
  const [simScores, setSimScores] = useState<Record<string, string>>({});
  const ephemeralCounter = useRef(0);

  const snapshot = useCallback(() => {
    const rows: SimEvaluationRow[] = [];
    const scores: Record<string, string> = {};
    evaluations.forEach((ev, index) => {
      const simKey = ev.id !== undefined ? `real-${ev.id}` : `real-i${index}`;
      rows.push({ ...ev, simKey, ephemeral: false });
      if (ev.score !== null && ev.score !== undefined) {
        scores[simKey] = String(ev.score);
      }
    });
    return { rows, scores };
  }, [evaluations]);

  const enterSimulation = useCallback(() => {
    const { rows, scores } = snapshot();
    ephemeralCounter.current = 0;
    setSimRows(rows);
    setSimScores(scores);
    setSimulateMode(true);
  }, [snapshot]);

  const exitSimulation = useCallback(() => {
    setSimulateMode(false);
    setSimRows([]);
    setSimScores({});
  }, []);

  const handleReset = useCallback(() => {
    const { rows, scores } = snapshot();
    ephemeralCounter.current = 0;
    setSimRows(rows);
    setSimScores(scores);
  }, [snapshot]);

  const setSimScore = useCallback((simKey: string, value: string) => {
    setSimScores((prev) => ({ ...prev, [simKey]: value }));
  }, []);

  const resolvedScore = useCallback(
    (row: SimEvaluationRow): number | null => {
      const raw = simScores[row.simKey];
      if (raw === undefined || raw === "") return row.score ?? null;
      return parseScoreInput(raw) ?? row.score ?? null;
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
      computeGradeRiskLite({
        evaluations: workingEvaluations,
        passingGrade,
        gradeMax,
        grade: null,
      }),
    [workingEvaluations, passingGrade, gradeMax]
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

  return {
    simulateMode,
    enterSimulation,
    exitSimulation,
    handleReset,
    simRows,
    simScores,
    setSimScore,
    resolvedScore,
    workingEvaluations,
    simGradeRisk,
    getSimMinimum,
  };
}
