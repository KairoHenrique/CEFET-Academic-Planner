import AsyncStorage from "@react-native-async-storage/async-storage";
import type { BillingCheckoutResponse } from "@acme/api-contracts";

const PENDING_CHECKOUT_KEY = "planner-pending-checkout";

export async function savePendingCheckout(
  result: BillingCheckoutResponse
): Promise<void> {
  await AsyncStorage.setItem(PENDING_CHECKOUT_KEY, JSON.stringify(result));
}

export async function readPendingCheckout(
  paymentId?: string | null
): Promise<BillingCheckoutResponse | null> {
  const raw = await AsyncStorage.getItem(PENDING_CHECKOUT_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as BillingCheckoutResponse;
    if (paymentId && parsed.payment.id !== paymentId) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function clearPendingCheckout(): Promise<void> {
  await AsyncStorage.removeItem(PENDING_CHECKOUT_KEY);
}
