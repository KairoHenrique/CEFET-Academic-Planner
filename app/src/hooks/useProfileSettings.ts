"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiClientError, patchPerfil } from "@/lib/api/client";
import { queryKeys } from "@/lib/query/keys";
import type { PatchPerfilBody, PerfilResponse } from "@/lib/types/perfil-api";
import { PERFIL_QUERY_KEY } from "@/hooks/usePerfil";

export function useProfileSettings() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (body: PatchPerfilBody) => patchPerfil(body),
    onMutate: async (body) => {
      if (!body.notifications) return { previous: undefined };

      await queryClient.cancelQueries({ queryKey: PERFIL_QUERY_KEY });
      const previous = queryClient.getQueryData<PerfilResponse>(PERFIL_QUERY_KEY);

      if (previous) {
        queryClient.setQueryData<PerfilResponse>(PERFIL_QUERY_KEY, {
          ...previous,
          notifications: {
            ...previous.notifications,
            ...body.notifications,
          },
        });
      }

      return { previous };
    },
    onError: (_error, _body, context) => {
      if (context?.previous) {
        queryClient.setQueryData(PERFIL_QUERY_KEY, context.previous);
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData<PerfilResponse>(PERFIL_QUERY_KEY, data);
      void queryClient.invalidateQueries({ queryKey: queryKeys.notifications() });
    },
  });

  const errorMessage =
    mutation.error instanceof ApiClientError
      ? mutation.error.message
      : mutation.error
        ? "Não foi possível salvar as alterações."
        : null;

  return {
    patchProfile: mutation.mutate,
    patchProfileAsync: mutation.mutateAsync,
    isSaving: mutation.isPending,
    error: errorMessage,
  };
}
