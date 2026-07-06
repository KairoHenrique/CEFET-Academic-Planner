"use client";

import { useQuery } from "@tanstack/react-query";
import { getBillingAccount } from "@/lib/api/client";
import { queryKeys } from "@/lib/query/keys";

export function useBillingAccount() {
  return useQuery({
    queryKey: queryKeys.billingAccount(),
    queryFn: getBillingAccount,
    staleTime: 30_000,
  });
}
