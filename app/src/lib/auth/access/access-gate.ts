import { unauthorizedError, subscriptionRequiredError } from "@/lib/api/errors";
import type { AppProfileRecord } from "@/lib/auth/account/types";
import {
  isAppAccessAllowed,
  resolveAppAccessForCpf,
  type AppAccessSnapshot,
} from "@/lib/auth/access/access-status";

const ACCESS_GATE_EXEMPT_PATHS = new Set([
  "/api/health",
  "/api/perfil",
]);

export function shouldEnforceAccessGate(request: Request): boolean {
  const pathname = new URL(request.url).pathname;
  if (pathname.startsWith("/api/auth/")) {
    return false;
  }
  if (ACCESS_GATE_EXEMPT_PATHS.has(pathname)) {
    return false;
  }
  return pathname.startsWith("/api/");
}

export async function enforceAppAccessGate(
  profile: AppProfileRecord | null
): Promise<AppAccessSnapshot> {
  if (!profile) {
    throw unauthorizedError(
      "Sessão ausente ou inválida. Faça login com CPF e senha."
    );
  }

  const access = await resolveAppAccessForCpf(profile.cpf);
  if (!isAppAccessAllowed(access.status)) {
    throw subscriptionRequiredError(
      "Seu acesso expirou. Renove em Planos para continuar.",
      {
        status: access.status,
        renewHref: access.renewHref,
        expiresAt: access.expiresAt,
        daysRemaining: access.daysRemaining,
      }
    );
  }

  return access;
}
