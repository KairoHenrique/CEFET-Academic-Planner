"use client";

import { useMemo, useState } from "react";
import type { Subject, SubjectEvaluation } from "@/config/mock/subjects";
import { semesterSubjects } from "@/config/mock/subjects";
import { computeWeightedAverage } from "@/lib/engine/rg";
import { useGradeSimulation } from "@/hooks/useGradeSimulation";

export function useSubjectGrades(
  subject: Pick<Subject, "code" | "grade" | "passingGrade" | "evaluations">
) {
  const [evaluations, setEvaluations] = useState<SubjectEvaluation[]>(
    subject.evaluations
  );

  const simulation = useGradeSimulation({
    evaluations,
    passingGrade: subject.passingGrade,
  });

  const currentRg = computeWeightedAverage(semesterSubjects);
  const simulatedRg = useMemo(() => {
    if (!simulation.simulateMode) return null;
    const simulatedGrade = simulation.simulatedTotal;
    return computeWeightedAverage(semesterSubjects, {
      [subject.code]: simulatedGrade,
    });
  }, [simulation.simulateMode, simulation.simulatedTotal, subject.code]);

  const addEvaluation = (evaluation: SubjectEvaluation) => {
    setEvaluations((prev) => [...prev, evaluation]);
  };

  const distributed = evaluations.reduce(
    (acc, ev, index) => acc + (simulation.resolvedScores[index] ?? 0),
    0
  );
  const currentTotal = subject.grade ?? distributed;

  return {
    evaluations,
    ...simulation,
    currentRg,
    simulatedRg,
    currentTotal,
    addEvaluation,
  };
}
