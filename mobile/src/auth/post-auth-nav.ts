import type { PerfilSubscriptionStatus } from "@acme/api-contracts";
import { resolvePlanosFlowForStatus } from "../features/planos/planos-utils";
import type { RootStackParamList } from "../navigation/types";

type PendingRoute = {
  name: keyof RootStackParamList;
  params?: RootStackParamList[keyof RootStackParamList];
};

let pending: PendingRoute | null = null;

/**
 * Paridade com `resolvePostAuthRedirect` do site:
 * trial → Planos welcome; pago ativo → Dashboard; bloqueado → Paywall (App.tsx).
 */
export function queuePostAuthNavigation(status: PerfilSubscriptionStatus): void {
  const flow = resolvePlanosFlowForStatus(status);
  if (flow === "welcome") {
    pending = { name: "Planos", params: { flow: "welcome" } };
    return;
  }
  pending = null;
}

export function consumePostAuthNavigation(): PendingRoute | null {
  const next = pending;
  pending = null;
  return next;
}
