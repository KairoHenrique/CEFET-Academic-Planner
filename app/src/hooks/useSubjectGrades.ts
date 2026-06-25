"use client";

import { useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Subject, SubjectEvaluation } from "@/lib/types/subject";
import { patchDisciplinaNotas } from "@/lib/api/client";
import { computeWeightedAverage } from "@/lib/engine/rg";
import { useGradeSimulation } from "@/hooks/useGradeSimulation";
import { useDisciplinas } from "@/hooks/useDisciplinas";
import { queryKeys } from "@/lib/query/keys";

export function useSubjectGrades(
  subject: Pick<Subject, "code" | "grade" | "passingGrade" | "evaluations">
) {
  const queryClient = useQueryClient();
  const { items: semesterItems } = useDisciplinas();

  const evaluations = subject.evaluations;

  const simulation = useGradeSimulation({
    evaluations,
    passingGrade: subject.passingGrade,
  });

  const rgSubjects = useMemo(
    () =>
      semesterItems.map((item) => ({
        code: item.code,
        grade: item.code === subject.code ? subject.grade : item.grade,
        ch: item.ch ?? 0,
      })),
    [semesterItems, subject.code, subject.grade]
  );

  const currentRg = computeWeightedAverage(rgSubjects);

  const simulatedRg = useMemo(() => {
    if (!simulation.simulateMode) return null;
    return computeWeightedAverage(rgSubjects, {
      [subject.code]: simulation.simulatedTotal,
    });
  }, [simulation.simulateMode, simulation.simulatedTotal, rgSubjects, subject.code]);

  const addMutation = useMutation({
    mutationFn: (evaluation: SubjectEvaluation) =>
      patchDisciplinaNotas(subject.code, {
        action: "add",
        avaliacao_nome: evaluation.name,
        nota_maxima: evaluation.max,
        nota_obtida: evaluation.score,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.disciplina(subject.code),
      });
      void queryClient.invalidateQueries({ queryKey: queryKeys.disciplinas() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard() });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: { id: number; nota_obtida: number | null }) =>
      patchDisciplinaNotas(subject.code, {
        action: "update",
        id: payload.id,
        nota_obtida: payload.nota_obtida,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.disciplina(subject.code),
      });
      void queryClient.invalidateQueries({ queryKey: queryKeys.disciplinas() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard() });
    },
  });

  const addEvaluation = async (evaluation: SubjectEvaluation) => {
    await addMutation.mutateAsync(evaluation);
  };

  const updateEvaluationScore = async (id: number, notaObtida: number | null) => {
    await updateMutation.mutateAsync({ id, nota_obtida: notaObtida });
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
    updateEvaluationScore,
    isSaving: addMutation.isPending || updateMutation.isPending,
    saveError:
      (addMutation.error ?? updateMutation.error) instanceof Error
        ? (addMutation.error ?? updateMutation.error)?.message
        : null,
  };
}
