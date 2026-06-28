"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ApiClientError,
  getDashboard,
  SYNC_COMPLETE_EVENT,
} from "@/lib/api/client";
import { queryKeys } from "@/lib/query/keys";
import type { DashboardResponse } from "@/lib/types/dashboard";

export function useDashboard() {
  const query = useQuery({
    queryKey: queryKeys.dashboard(),
    queryFn: (): Promise<DashboardResponse> => getDashboard(),
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
        : "Não foi possível carregar o dashboard."
      : null;

  return {
    data: needsSync ? null : (query.data ?? null),
    loading: query.isLoading,
    error: errorMessage,
    needsSync,
    refetch: query.refetch,
  };
}
