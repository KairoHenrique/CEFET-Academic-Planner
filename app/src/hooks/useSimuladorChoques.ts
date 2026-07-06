"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ApiClientError, postSimuladorChoques } from "@/lib/api/client";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import {
  resolveConflictCellKeys,
  resolveConflictTurmaIds,
} from "@/lib/simulador/resolve-conflict-cells";
import { queryKeys } from "@/lib/query/keys";

export function useSimuladorChoques(placedTurmaIds: readonly string[]) {
  const debouncedIds = useDebouncedValue(placedTurmaIds, 350);
  const queryKey = useMemo(
    () => [...debouncedIds].sort().join("|"),
    [debouncedIds]
  );

  const query = useQuery({
    queryKey: queryKeys.simuladorChoques(queryKey),
    queryFn: () =>
      postSimuladorChoques({
        turmaSigaaIds: [...debouncedIds],
      }),
    enabled: debouncedIds.length > 0,
    staleTime: 20_000,
    retry: (failureCount, error) => {
      if (error instanceof ApiClientError && error.status < 500) {
        return false;
      }
      return failureCount < 1;
    },
  });

  const conflicts = query.data?.conflicts ?? [];

  const conflictCellKeys = useMemo(
    () => resolveConflictCellKeys(conflicts),
    [conflicts]
  );

  const conflictTurmaIds = useMemo(
    () => resolveConflictTurmaIds(conflicts),
    [conflicts]
  );

  return {
    hasConflicts: query.data?.hasConflicts ?? false,
    conflicts,
    conflictCellKeys,
    conflictTurmaIds,
    checking: query.isFetching,
  };
}
