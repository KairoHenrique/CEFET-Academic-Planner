"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { ApiClientError, getMapa, SYNC_COMPLETE_EVENT } from "@/lib/api/client";
import { queryKeys } from "@/lib/query/keys";
import type { MapaResponse } from "@/lib/types/mapa-api";

export function useMapa() {
  const query = useQuery({
    queryKey: queryKeys.mapa(),
    queryFn: (): Promise<MapaResponse> => getMapa(),
    retry: (failureCount, error) => {
      if (error instanceof ApiClientError && error.status === 404) {
        return false;
      }
      return failureCount < 1;
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
        : "Não foi possível carregar o mapa do curso."
      : null;

  return {
    data: needsSync ? null : (query.data ?? null),
    loading: query.isLoading,
    error: errorMessage,
    needsSync,
    refetch: query.refetch,
  };
}
