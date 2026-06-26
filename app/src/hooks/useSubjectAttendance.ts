"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { patchDisciplinaFalta } from "@/lib/api/client";
import type { AttendanceStatus } from "@/lib/types/attendance";
import { queryKeys } from "@/lib/query/keys";

export function useSubjectAttendance(subjectCode: string) {
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: (payload: { id: number; status: AttendanceStatus }) =>
      patchDisciplinaFalta(subjectCode, {
        action: "update",
        id: payload.id,
        status: payload.status,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.disciplina(subjectCode),
      });
      void queryClient.invalidateQueries({ queryKey: queryKeys.disciplinas() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard() });
    },
  });

  const updateAttendanceStatus = async (
    id: number,
    status: AttendanceStatus
  ) => {
    await updateMutation.mutateAsync({ id, status });
  };

  return {
    updateAttendanceStatus,
    isSaving: updateMutation.isPending,
    saveError:
      updateMutation.error instanceof Error
        ? updateMutation.error.message
        : null,
  };
}
