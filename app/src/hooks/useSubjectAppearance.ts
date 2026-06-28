"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ApiClientError,
  patchDisciplinaAppearance,
} from "@/lib/api/client";
import {
  resolveSubjectDisplayName,
  resolveSubjectShortLabel,
} from "@/lib/disciplinas/subject-display-name";
import { queryKeys } from "@/lib/query/keys";
import type {
  PatchDisciplinaAppearanceBody,
  SubjectDetailResponse,
} from "@/lib/types/disciplinas-api";

function applyAppearancePatch(
  subject: SubjectDetailResponse["subject"],
  patch: PatchDisciplinaAppearanceBody
) {
  const nextColor = patch.color ?? subject.color;
  const nextNickname =
    patch.apelido !== undefined ? patch.apelido : subject.nickname;
  const officialName = subject.officialName;
  const nextName =
    patch.nome !== undefined
      ? patch.nome?.trim() || officialName
      : subject.name;

  return {
    ...subject,
    color: nextColor,
    nickname: nextNickname,
    name: nextName,
    displayName: resolveSubjectDisplayName(nextName, nextNickname),
    shortLabel: resolveSubjectShortLabel(subject.code, nextNickname, nextName),
  };
}

export function useSubjectAppearance(
  code: string,
  current: { color: string; nickname: string | null }
) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (body: PatchDisciplinaAppearanceBody) =>
      patchDisciplinaAppearance(code, body),
    onMutate: async (body) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.disciplina(code) });
      const previous = queryClient.getQueryData<SubjectDetailResponse>(
        queryKeys.disciplina(code)
      );
      if (previous) {
        queryClient.setQueryData<SubjectDetailResponse>(
          queryKeys.disciplina(code),
          {
            ...previous,
            subject: applyAppearancePatch(previous.subject, body),
          }
        );
      }
      return { previous };
    },
    onError: (_error, _body, context) => {
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
    color: current.color,
    nickname: current.nickname,
    isSaving: mutation.isPending,
    error:
      mutation.error instanceof ApiClientError
        ? mutation.error.message
        : mutation.error
          ? "Não foi possível salvar."
          : null,
    updateColor: (color: string) => mutation.mutate({ color }),
    updateDisplay: (payload: { nome?: string | null; apelido?: string | null }) =>
      mutation.mutate(payload),
    updateNickname: (apelido: string | null) => mutation.mutate({ apelido }),
  };
}
