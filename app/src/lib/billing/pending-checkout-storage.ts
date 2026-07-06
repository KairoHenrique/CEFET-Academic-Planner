import type { BillingCheckoutResponse } from "@/lib/billing/checkout/types";

export const PENDING_CHECKOUT_STORAGE_KEY = "planner-pending-checkout";

export function savePendingCheckout(result: BillingCheckoutResponse): void {
  if (typeof window === "undefined") {
    return;
  }

  sessionStorage.setItem(PENDING_CHECKOUT_STORAGE_KEY, JSON.stringify(result));
}

export function readPendingCheckout(
  paymentId?: string | null
): BillingCheckoutResponse | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = sessionStorage.getItem(PENDING_CHECKOUT_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as BillingCheckoutResponse;
    if (paymentId && parsed.payment.id !== paymentId) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearPendingCheckout(): void {
  if (typeof window === "undefined") {
    return;
  }

  sessionStorage.removeItem(PENDING_CHECKOUT_STORAGE_KEY);
}
