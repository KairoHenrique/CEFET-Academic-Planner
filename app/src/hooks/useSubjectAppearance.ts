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
import { resolveSubjectDisplayRoom } from "@/lib/disciplinas/subject-room";
import {
  resolveDisplayProfessor,
  resolveDisplaySchedule,
  resolveDisplayWeeklyHours,
} from "@/lib/disciplinas/subject-schedule-meta";
import { queryKeys } from "@/lib/query/keys";
import type {
  PatchDisciplinaAppearanceBody,
  SubjectDetailResponse,
} from "@/lib/types/disciplinas-api";

function applyAppearancePatch(
  subject: SubjectDetailResponse["subject"],
  patch: PatchDisciplinaAppearanceBody
) {
  const semestreLike = {
    local: subject.syncedRoom,
    local_exibicao: patch.sala !== undefined ? patch.sala : null,
    codigo_horario: null,
    horario_traduzido: subject.syncedSchedule,
    horario_exibicao: patch.horario !== undefined ? patch.horario : null,
    professor: subject.syncedProfessor,
    professor_exibicao: patch.professor !== undefined ? patch.professor : null,
    horas_semanais_exibicao:
      patch.horasSemanais !== undefined ? patch.horasSemanais : null,
  };

  const nextName =
    patch.nome !== undefined
      ? patch.nome?.trim() || subject.officialName
      : subject.name;
  const nextNickname =
    patch.apelido !== undefined ? patch.apelido : subject.nickname;
  const weeklyHours = resolveDisplayWeeklyHours(semestreLike);

  return {
    ...subject,
    color: patch.color ?? subject.color,
    nickname: nextNickname,
    name: nextName,
    room:
      patch.sala !== undefined
        ? resolveSubjectDisplayRoom(semestreLike)
        : subject.room,
    schedule:
      patch.horario !== undefined
        ? resolveDisplaySchedule(semestreLike) ?? undefined
        : subject.schedule,
    professor:
      patch.professor !== undefined
        ? resolveDisplayProfessor(semestreLike) ?? undefined
        : subject.professor,
    ch:
      patch.horasSemanais !== undefined
        ? weeklyHours != null && weeklyHours > 0
          ? weeklyHours
          : undefined
        : subject.ch,
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
      void queryClient.invalidateQueries({ queryKey: queryKeys.schedule() });
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
    updateDisplay: (payload: PatchDisciplinaAppearanceBody) =>
      mutation.mutate(payload),
    updateNickname: (apelido: string | null) => mutation.mutate({ apelido }),
  };
}
