"use client";

import { useMemo, useState } from "react";
import type { SubjectEvaluation } from "@/lib/types/subject";
import { computePendingTeacherPoints } from "@/lib/disciplinas/grade-risk";

interface UseGradeSimulationOptions {
  evaluations: SubjectEvaluation[];
  passingGrade: number;
  gradeMax: number;
}

export function useGradeSimulation({
  evaluations,
  passingGrade,
  gradeMax,
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

      const parsed = parseFloat(raw.replace(",", "."));
      return Number.isNaN(parsed) ? ev.score : parsed;
    });
  }, [evaluations, simulateMode, simulated]);

  const simulatedTotal = resolvedScores.reduce<number>(
    (acc, score) => acc + (score ?? 0),
    0
  );

  const approved = simulatedTotal >= passingGrade;
  const pointsNeeded = Math.max(0, passingGrade - simulatedTotal);
  const pendingTeacherPoints = useMemo(
    () => computePendingTeacherPoints(evaluations, gradeMax),
    [evaluations, gradeMax]
  );

  const getMinimumForEvaluation = (index: number): number | null => {
    if (evaluations[index].extra) return null;

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

  const buildSimulatedFromEvaluations = () => {
    const initial: Record<string, string> = {};
    for (const ev of evaluations) {
      if (ev.score !== null) {
        initial[ev.name] = String(ev.score);
      }
    }
    return initial;
  };

  const enterSimulation = () => {
    setSimulated(buildSimulatedFromEvaluations());
    setSimulateMode(true);
  };

  const handleReset = () => setSimulated(buildSimulatedFromEvaluations());

  const exitSimulation = () => {
    setSimulateMode(false);
    setSimulated({});
  };

  return {
    simulateMode,
    setSimulateMode,
    enterSimulation,
    simulated,
    resolvedScores,
    simulatedTotal,
    approved,
    pointsNeeded,
    pendingTeacherPoints,
    getMinimumForEvaluation,
    handleChange,
    handleReset,
    exitSimulation,
  };
}
