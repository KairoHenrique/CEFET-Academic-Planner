"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Subject, SubjectEvaluation } from "@/lib/types/subject";
import type { PatchNotasResponse, SubjectDetailResponse } from "@/lib/types/disciplinas-api";
import { patchDisciplinaNotas } from "@/lib/api/client";
import { roundFinalGradeTotal } from "@/lib/disciplinas/grade-rounding";
import {
  SUBJECT_DISPLAY_GRADE_MAX,
  SUBJECT_DISPLAY_PASSING_GRADE,
} from "@/lib/disciplinas/grade-display";
import { useGradeSimulation } from "@/hooks/useGradeSimulation";
import { queryKeys } from "@/lib/query/keys";

function applyNotasPatchToCache(
  queryClient: ReturnType<typeof useQueryClient>,
  code: string,
  response: PatchNotasResponse
): void {
  queryClient.setQueryData<SubjectDetailResponse>(
    queryKeys.disciplina(code),
    (current) => {
      if (!current) return current;
      return {
        ...current,
        subject: {
          ...current.subject,
          evaluations: response.evaluations,
          grade: response.grade,
        },
      };
    }
  );
}

export function useSubjectGrades(
  subject: Pick<
    Subject,
    "code" | "grade" | "gradeMax" | "passingGrade" | "gradeRisk" | "evaluations"
  >
) {
  const queryClient = useQueryClient();

  const evaluations = subject.evaluations;

  const simulation = useGradeSimulation({
    evaluations,
    passingGrade: SUBJECT_DISPLAY_PASSING_GRADE,
    gradeMax: SUBJECT_DISPLAY_GRADE_MAX,
  });

  const addMutation = useMutation({
    mutationFn: (evaluation: SubjectEvaluation) =>
      patchDisciplinaNotas(subject.code, {
        action: "add",
        avaliacao_nome: evaluation.name,
        nota_maxima: evaluation.max,
        nota_obtida: evaluation.score,
        nota_extra: evaluation.extra,
      }),
    onSuccess: (response) => {
      applyNotasPatchToCache(queryClient, subject.code, response);
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
    onSuccess: (response) => {
      applyNotasPatchToCache(queryClient, subject.code, response);
      void queryClient.invalidateQueries({
        queryKey: queryKeys.disciplina(subject.code),
      });
      void queryClient.invalidateQueries({ queryKey: queryKeys.disciplinas() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard() });
    },
  });

  const updateManualMutation = useMutation({
    mutationFn: (payload: {
      id: number;
      avaliacao_nome?: string;
      nota_maxima?: number;
      nota_obtida?: number | null;
      nota_extra?: boolean;
    }) =>
      patchDisciplinaNotas(subject.code, {
        action: "update_manual",
        id: payload.id,
        avaliacao_nome: payload.avaliacao_nome,
        nota_maxima: payload.nota_maxima,
        nota_obtida: payload.nota_obtida,
        nota_extra: payload.nota_extra,
      }),
    onSuccess: (response) => {
      applyNotasPatchToCache(queryClient, subject.code, response);
      void queryClient.invalidateQueries({
        queryKey: queryKeys.disciplina(subject.code),
      });
      void queryClient.invalidateQueries({ queryKey: queryKeys.disciplinas() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard() });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      patchDisciplinaNotas(subject.code, { action: "delete", id }),
    onSuccess: (response) => {
      applyNotasPatchToCache(queryClient, subject.code, response);
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

  const updateManualEvaluation = async (payload: {
    id: number;
    avaliacao_nome?: string;
    nota_maxima?: number;
    nota_obtida?: number | null;
    nota_extra?: boolean;
  }) => {
    await updateManualMutation.mutateAsync(payload);
  };

  const deleteEvaluation = async (id: number) => {
    await deleteMutation.mutateAsync(id);
  };

  const distributed = evaluations.reduce(
    (acc, ev, index) => acc + (simulation.resolvedScores[index] ?? 0),
    0
  );
  const currentTotal =
    subject.grade ?? roundFinalGradeTotal(distributed);

  return {
    evaluations,
    ...simulation,
    currentTotal,
    addEvaluation,
    updateEvaluationScore,
    updateManualEvaluation,
    deleteEvaluation,
    isSaving:
      addMutation.isPending ||
      updateMutation.isPending ||
      updateManualMutation.isPending ||
      deleteMutation.isPending,
    saveError:
      (
        addMutation.error ??
        updateMutation.error ??
        updateManualMutation.error ??
        deleteMutation.error
      ) instanceof Error
        ? (
            addMutation.error ??
            updateMutation.error ??
            updateManualMutation.error ??
            deleteMutation.error
          )?.message
        : null,
  };
}
