import type { PerfilSubscriptionStatus } from "@/lib/types/perfil-api";
import { isSubscriptionBlocked } from "@/lib/billing/access/subscription-access-rules";

export type PlanosFlow = "welcome" | "renew" | "pending" | "exists";

export function isSubscriptionExemptPath(pathname: string): boolean {
  if (pathname === "/login") {
    return true;
  }

  if (pathname === "/planos" || pathname.startsWith("/planos/")) {
    return true;
  }

  if (pathname === "/dev" || pathname.startsWith("/dev/")) {
    return true;
  }

  return false;
}

export function resolvePlanosFlowForStatus(
  status: PerfilSubscriptionStatus
): PlanosFlow | null {
  if (status === "trial_expired" || status === "expired") {
    return "renew";
  }

  if (status === "pending_payment") {
    return "pending";
  }

  if (status === "trial_active") {
    return "welcome";
  }

  return null;
}

export function shouldGuardSubscriptionAccess(
  status: PerfilSubscriptionStatus,
  pathname: string
): boolean {
  if (!isSubscriptionBlocked(status)) {
    return false;
  }

  return !isSubscriptionExemptPath(pathname);
}

export function resolveSubscriptionGuardHref(
  status: PerfilSubscriptionStatus
): string {
  const flow = resolvePlanosFlowForStatus(status) ?? "renew";
  return `/planos?flow=${flow}`;
}
