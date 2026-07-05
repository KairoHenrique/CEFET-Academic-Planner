"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiClientError } from "@/lib/api/client";
import {
  getDevAccounts,
  getDevAuditLog,
  getDevSession,
  getDevSyncPolicy,
  getDevSyncStatus,
  patchDevSyncPolicy,
  postDevLogin,
  postDevLogout,
  postDevRobotsRun,
  resetDevSyncPolicy,
} from "@/lib/dev-panel/client-api";
import type { DevRobotRunRequest } from "@/lib/dev-panel/types";
import type { SyncPolicyOverrides } from "@/lib/sync-policy/types";
import { queryKeys } from "@/lib/query/keys";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

export function useDevSession() {
  return useQuery({
    queryKey: queryKeys.devSession(),
    queryFn: getDevSession,
    retry: false,
    staleTime: 60_000,
  });
}

export function useDevLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: postDevLogin,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [...queryKeys.all, "dev"] });
    },
  });
}

export function useDevLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: postDevLogout,
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: [...queryKeys.all, "dev"] });
    },
  });
}

export function useDevAccounts(search: string) {
  const debouncedSearch = useDebouncedValue(search.trim(), 300);

  return useQuery({
    queryKey: queryKeys.devAccounts(debouncedSearch),
    queryFn: () => getDevAccounts(debouncedSearch || undefined),
    retry: (count, error) => {
      if (error instanceof ApiClientError && error.code === "UNAUTHORIZED") {
        return false;
      }
      return count < 1;
    },
  });
}

export function useDevSyncPolicy(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.devSyncPolicy(),
    queryFn: getDevSyncPolicy,
    enabled,
    retry: false,
  });
}

export function useDevPatchSyncPolicy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (patch: SyncPolicyOverrides) => patchDevSyncPolicy(patch),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.devSyncPolicy() });
    },
  });
}

export function useDevResetSyncPolicy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: resetDevSyncPolicy,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.devSyncPolicy() });
    },
  });
}

export function useDevRunRobots() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: DevRobotRunRequest) => postDevRobotsRun(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.devAuditLog() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.devAccounts("") });
      void queryClient.invalidateQueries({ queryKey: queryKeys.devSyncStatus() });
    },
  });
}

export function useDevSyncStatus(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.devSyncStatus(),
    queryFn: getDevSyncStatus,
    enabled,
    refetchInterval: 15_000,
    staleTime: 10_000,
  });
}

export function useDevAuditLog(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.devAuditLog(),
    queryFn: () => getDevAuditLog(15),
    enabled,
    staleTime: 30_000,
  });
}
