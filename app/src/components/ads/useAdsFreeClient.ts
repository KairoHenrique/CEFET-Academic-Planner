"use client";

import { useBillingAccount } from "@/hooks/useBillingAccount";

export function useAdsFreeClient(): {
  adsFree: boolean;
  loading: boolean;
} {
  const query = useBillingAccount();
  return {
    adsFree: Boolean(query.data?.adsFree?.active),
    loading: query.isLoading,
  };
}
