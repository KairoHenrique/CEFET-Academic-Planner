"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { ApiClientError, getSchedule, SYNC_COMPLETE_EVENT } from "@/lib/api/client";
import { queryKeys } from "@/lib/query/keys";
import type { ScheduleApiResponse } from "@/lib/types/schedule-api";

export function useSchedule() {
  const query = useQuery({
    queryKey: queryKeys.schedule(),
    queryFn: (): Promise<ScheduleApiResponse> => getSchedule(),
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
        : "Não foi possível carregar a grade semanal."
      : null;

  return {
    data: needsSync ? null : (query.data ?? null),
    loading: query.isLoading,
    error: errorMessage,
    needsSync,
    refetch: query.refetch,
  };
}
