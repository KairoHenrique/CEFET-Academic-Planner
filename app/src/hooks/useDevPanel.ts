"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiClientError } from "@/lib/api/client";
import {
  getDevAccounts,
  getDevAuditLog,
  getDevGiftKeys,
  getDevSession,
  getDevSubscriptions,
  getDevSyncPolicy,
  getDevSyncStatus,
  patchDevRevokeGiftKey,
  patchDevSyncPolicy,
  deleteDevSitePromo,
  postDevAccountEmailsCron,
  postDevCreateGiftKeys,
  postDevDispatchPromotion,
  postDevGrantSubscription,
  postDevLogin,
  postDevLogout,
  postDevOrchestratorTick,
  postDevRetrySyncJob,
  postDevRevokeSubscription,
  postDevRobotsRun,
  resetDevSyncPolicy,
  getDevMaintenancePolicy,
  putDevMaintenancePolicy,
} from "@/lib/dev-panel/client-api";
import type {
  DevGrantSubscriptionRequest,
  DevPromotionRequest,
  DevRobotRunRequest,
} from "@/lib/dev-panel/types";
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

export function useDevGrantSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: DevGrantSubscriptionRequest) =>
      postDevGrantSubscription(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.devAccounts("") });
      void queryClient.invalidateQueries({ queryKey: queryKeys.devAuditLog() });
    },
  });
}

export function useDevDispatchPromotion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: DevPromotionRequest) => postDevDispatchPromotion(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.devAuditLog() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.billingPlans() });
    },
  });
}

export function useDevClearSitePromo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => deleteDevSitePromo(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.devAuditLog() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.billingPlans() });
    },
  });
}

export function useDevGiftKeys(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.devGiftKeys(),
    queryFn: () => getDevGiftKeys(100),
    enabled,
    retry: false,
    staleTime: 15_000,
  });
}

export function useDevCreateGiftKeys() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: {
      planId: string;
      days: number;
      count: number;
      label?: string;
    }) => postDevCreateGiftKeys(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.devGiftKeys() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.devAuditLog() });
    },
  });
}

export function useDevRevokeGiftKey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (code: string) => patchDevRevokeGiftKey(code),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.devGiftKeys() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.devAuditLog() });
    },
  });
}

export function useDevOrchestratorTick() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: postDevOrchestratorTick,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.devSyncStatus() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.devAuditLog() });
    },
  });
}

export function useDevAccountEmailsCron() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: postDevAccountEmailsCron,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.devAuditLog() });
    },
  });
}

export function useDevRetrySyncJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (jobId: string) => postDevRetrySyncJob(jobId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.devSyncStatus() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.devAuditLog() });
    },
  });
}

export function useDevSubscriptions(accountRef: string | null) {
  return useQuery({
    queryKey: queryKeys.devSubscriptions(accountRef ?? ""),
    queryFn: () => getDevSubscriptions(accountRef as string),
    enabled: Boolean(accountRef),
    retry: false,
    staleTime: 10_000,
  });
}

export function useDevRevokeSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (accountRef: string) => postDevRevokeSubscription(accountRef),
    onSuccess: (_data, accountRef) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.devAccounts("") });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.devSubscriptions(accountRef),
      });
      void queryClient.invalidateQueries({ queryKey: queryKeys.devAuditLog() });
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

export function useDevMaintenancePolicy(enabled: boolean) {
  return useQuery({
    queryKey: [...queryKeys.all, "dev", "maintenance"],
    queryFn: getDevMaintenancePolicy,
    enabled,
    retry: false,
  });
}

export function useDevPutMaintenancePolicy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: putDevMaintenancePolicy,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [...queryKeys.all, "dev", "maintenance"] });
      void queryClient.invalidateQueries({ queryKey: queryKeys.devAuditLog() });
    },
  });
}
