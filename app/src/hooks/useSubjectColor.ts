"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiClientError, patchDisciplinaAppearance } from "@/lib/api/client";
import { queryKeys } from "@/lib/query/keys";
import type { SubjectDetailResponse } from "@/lib/types/disciplinas-api";

export function useSubjectColor(code: string, currentColor: string) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (color: string) => patchDisciplinaAppearance(code, { color }),
    onMutate: async (color) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.disciplina(code) });
      const previous = queryClient.getQueryData<SubjectDetailResponse>(
        queryKeys.disciplina(code)
      );
      if (previous) {
        queryClient.setQueryData<SubjectDetailResponse>(
          queryKeys.disciplina(code),
          {
            ...previous,
            subject: { ...previous.subject, color },
          }
        );
      }
      return { previous };
    },
    onError: (_error, _color, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.disciplina(code), context.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.disciplina(code) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.disciplinas() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.calendar() });
    },
  });

  return {
    color: currentColor,
    isSaving: mutation.isPending,
    error:
      mutation.error instanceof ApiClientError
        ? mutation.error.message
        : mutation.error
          ? "Não foi possível salvar a cor."
          : null,
    updateColor: (color: string) => mutation.mutate(color),
  };
}
