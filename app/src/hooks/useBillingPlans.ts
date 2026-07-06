"use client";

import { useQuery } from "@tanstack/react-query";
import { getBillingPlans } from "@/lib/api/client";
import { queryKeys } from "@/lib/query/keys";

export function useBillingPlans() {
  return useQuery({
    queryKey: queryKeys.billingPlans(),
    queryFn: getBillingPlans,
    staleTime: 60_000,
  });
}
