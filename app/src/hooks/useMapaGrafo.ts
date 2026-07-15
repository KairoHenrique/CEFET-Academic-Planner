"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ApiClientError,
  getMapaGrafo,
  SYNC_COMPLETE_EVENT,
} from "@/lib/api/client";
import { queryKeys } from "@/lib/query/keys";
import type { MapaGrafoResponse } from "@/lib/types/mapa-grafo-api";

export function useMapaGrafo(enabled = true) {
  const query = useQuery({
    queryKey: queryKeys.mapaGrafo(),
    queryFn: (): Promise<MapaGrafoResponse> => getMapaGrafo(),
    enabled,
    retry: (failureCount, error) => {
      if (error instanceof ApiClientError && error.status === 404) {
        return false;
      }
      return failureCount < 1;
    },
  });

  useEffect(() => {
    if (!enabled) return;

    const handleSyncComplete = () => {
      void query.refetch();
    };

    window.addEventListener(SYNC_COMPLETE_EVENT, handleSyncComplete);
    return () =>
      window.removeEventListener(SYNC_COMPLETE_EVENT, handleSyncComplete);
  }, [enabled, query.refetch]);

  const needsSync =
    query.error instanceof ApiClientError && query.error.status === 404;

  const errorMessage =
    !needsSync && query.error
      ? query.error instanceof ApiClientError
        ? query.error.message
        : "Não foi possível carregar o grafo do curso."
      : null;

  return {
    data: needsSync ? null : (query.data ?? null),
    loading: enabled && query.isLoading,
    error: errorMessage,
    needsSync,
    refetch: query.refetch,
  };
}
