import { subscriptionRequiredError, unauthorizedError } from "@/lib/api/errors";
import type { AppProfileRecord } from "@/lib/auth/account/types";
import {
  isSubscriptionAccessAllowed,
  resolveSubscriptionAccessForCpf,
} from "@/lib/billing/access/resolve-subscription-access";
import type { AppAccessSnapshot } from "@/lib/auth/access/access-status";

const BLOCKED_STATUS_MESSAGES: Partial<Record<string, string>> = {
  pending_payment:
    "Aguardando confirmação do PIX. Conclua o pagamento em Planos para liberar o acesso.",
  trial_expired:
    "Seu trial expirou. Escolha um plano em Planos para continuar.",
  expired:
    "Sua assinatura expirou. Renove em Planos para continuar.",
  cancelled:
    "Assinatura cancelada. Escolha um plano em Planos para continuar.",
};

function resolveBlockedMessage(status: string): string {
  return (
    BLOCKED_STATUS_MESSAGES[status] ??
    "Seu acesso expirou. Renove em Planos para continuar."
  );
}

export async function enforceSubscriptionAccessGate(
  profile: AppProfileRecord | null
): Promise<AppAccessSnapshot> {
  if (!profile) {
    throw unauthorizedError(
      "Sessão ausente ou inválida. Faça login com CPF e senha."
    );
  }

  const access = await resolveSubscriptionAccessForCpf(profile.cpf);

  if (!isSubscriptionAccessAllowed(access.status)) {
    throw subscriptionRequiredError(resolveBlockedMessage(access.status), {
      status: access.status,
      renewHref: access.renewHref,
      expiresAt: access.expiresAt,
      daysRemaining: access.daysRemaining,
      planId: access.planId,
    });
  }

  return {
    status: access.status,
    renewHref: access.renewHref,
    expiresAt: access.expiresAt,
    daysRemaining: access.daysRemaining,
  };
}
