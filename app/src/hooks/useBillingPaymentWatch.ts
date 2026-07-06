"use client";

import { useQuery } from "@tanstack/react-query";
import { getBillingPaymentStatus } from "@/lib/api/client";
import { queryKeys } from "@/lib/query/keys";
import {
  isPaymentAwaitingConfirmation,
  isPaymentTerminalFailure,
  isPaymentTerminalSuccess,
} from "@/lib/billing/payments/payment-view";

const POLL_INTERVAL_MS = 4_000;

export function useBillingPaymentWatch(paymentId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.billingPayment(paymentId ?? "none"),
    queryFn: () => getBillingPaymentStatus(paymentId!),
    enabled: enabled && Boolean(paymentId),
    refetchInterval: (query) => {
      const status = query.state.data?.payment.status;
      if (!status) {
        return POLL_INTERVAL_MS;
      }
      if (
        isPaymentTerminalSuccess(status) ||
        isPaymentTerminalFailure(status) ||
        !isPaymentAwaitingConfirmation(status)
      ) {
        return false;
      }
      return POLL_INTERVAL_MS;
    },
    staleTime: 0,
  });
}
