import type { AppProfileRecord } from "@/lib/auth/account/types";
import { enforceSubscriptionAccessGate } from "@/lib/billing/access/enforce-subscription-access-gate";
import type { AppAccessSnapshot } from "@/lib/auth/access/access-status";

const ACCESS_GATE_EXEMPT_PATHS = new Set([
  "/api/health",
  "/api/perfil",
  "/api/push/register",
]);

function isBillingRoute(pathname: string): boolean {
  return pathname.startsWith("/api/billing/");
}

export function shouldEnforceAccessGate(request: Request): boolean {
  const pathname = new URL(request.url).pathname;
  if (pathname.startsWith("/api/auth/")) {
    return false;
  }
  if (ACCESS_GATE_EXEMPT_PATHS.has(pathname)) {
    return false;
  }
  if (isBillingRoute(pathname)) {
    return false;
  }
  return pathname.startsWith("/api/");
}

export { enforceSubscriptionAccessGate };

export async function enforceAppAccessGate(
  profile: AppProfileRecord | null
): Promise<AppAccessSnapshot> {
  return enforceSubscriptionAccessGate(profile);
}
