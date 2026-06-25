"use client";

import { useMemo, useState } from "react";
import type { SubjectEvaluation } from "@/lib/types/subject";

interface UseGradeSimulationOptions {
  evaluations: SubjectEvaluation[];
  passingGrade: number;
}

export function useGradeSimulation({
  evaluations,
  passingGrade,
}: UseGradeSimulationOptions) {
  const [simulateMode, setSimulateMode] = useState(false);
  const [simulated, setSimulated] = useState<Record<string, string>>({});

  const resolvedScores = useMemo(() => {
    return evaluations.map((ev) => {
      if (!simulateMode) return ev.score;

      const raw = simulated[ev.name];
      if (raw === undefined || raw === "") {
        return ev.score;
      }

      const parsed = parseFloat(raw);
      return Number.isNaN(parsed) ? ev.score : parsed;
    });
  }, [evaluations, simulateMode, simulated]);

  const simulatedTotal = resolvedScores.reduce<number>(
    (acc, score) => acc + (score ?? 0),
    0
  );

  const approved = simulatedTotal >= passingGrade;
  const pointsNeeded = Math.max(0, passingGrade - simulatedTotal);
  const distributed = evaluations.reduce(
    (acc, ev, index) => acc + (resolvedScores[index] ?? 0),
    0
  );
  const remaining = evaluations.reduce((acc, ev) => acc + ev.max, 0) - distributed;

  const getMinimumForEvaluation = (index: number): number => {
    const othersTotal = resolvedScores.reduce<number>(
      (acc, score, idx) => (idx === index ? acc : acc + (score ?? 0)),
      0
    );
    return Math.min(
      evaluations[index].max,
      Math.max(0, passingGrade - othersTotal)
    );
  };

  const handleChange = (name: string, value: string) => {
    setSimulated((prev) => ({ ...prev, [name]: value }));
  };

  const handleReset = () => setSimulated({});

  const exitSimulation = () => {
    setSimulateMode(false);
    setSimulated({});
  };

  return {
    simulateMode,
    setSimulateMode,
    simulated,
    resolvedScores,
    simulatedTotal,
    approved,
    pointsNeeded,
    remaining,
    getMinimumForEvaluation,
    handleChange,
    handleReset,
    exitSimulation,
  };
}
