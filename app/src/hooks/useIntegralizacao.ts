"use client";

import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ApiClientError,
  getIntegralizacao,
  postIntegralizacaoHours,
  SYNC_COMPLETE_EVENT,
} from "@/lib/api/client";
import { invalidateIntegralizacaoQueries } from "@/lib/query/invalidate-integralizacao";
import { queryKeys } from "@/lib/query/keys";
import type {
  IntegralizacaoResponse,
  PostIntegralizacaoBody,
} from "@/lib/types/integralizacao-api";

export function useIntegralizacao() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.integralizacao(),
    queryFn: (): Promise<IntegralizacaoResponse> => getIntegralizacao(),
    retry: (failureCount, error) => {
      if (error instanceof ApiClientError && error.status === 404) {
        return false;
      }
      return failureCount < 1;
    },
  });

  const registerMutation = useMutation({
    mutationFn: (body: PostIntegralizacaoBody) => postIntegralizacaoHours(body),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.integralizacao(), data);
      invalidateIntegralizacaoQueries(queryClient);
    },
  });

  useEffect(() => {
    const handleSyncComplete = () => {
      void query.refetch();
    };

    window.addEventListener(SYNC_COMPLETE_EVENT, handleSyncComplete);
    return () =>
      window.removeEventListener(SYNC_COMPLETE_EVENT, handleSyncComplete);
  }, [query.refetch]);

  const needsSync =
    query.error instanceof ApiClientError && query.error.status === 404;

  const errorMessage =
    !needsSync && query.error
      ? query.error instanceof ApiClientError
        ? query.error.message
        : "Não foi possível carregar a integralização."
      : null;

  return {
    data: needsSync ? null : (query.data ?? null),
    loading: query.isLoading,
    error: errorMessage,
    needsSync,
    refetch: query.refetch,
    registerHours: registerMutation.mutateAsync,
    isRegistering: registerMutation.isPending,
  };
}
