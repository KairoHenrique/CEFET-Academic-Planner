import type { PerfilSubscriptionStatus } from "@acme/api-contracts";
import type { RootStackParamList } from "../navigation/types";

type PendingRoute = {
  name: keyof RootStackParamList;
  params?: RootStackParamList[keyof RootStackParamList];
};

let pending: PendingRoute | null = null;

/** App gratuito — sem redirecionar para Planos/PIX. */
export function queuePostAuthNavigation(
  _status: PerfilSubscriptionStatus
): void {
  pending = null;
}

export function consumePostAuthNavigation(): PendingRoute | null {
  const next = pending;
  pending = null;
  return next;
}
