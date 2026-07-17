import { notFoundError, validationError } from "@/lib/api/errors";
import { findProfileByCpf } from "@/lib/auth/account/profile-repository";
import { cancelActiveSubscriptionsForUser } from "@/lib/billing/checkout/billing-subscription-repository";
import { ensurePostgresReady } from "@/lib/db/bootstrap-postgres";
import { resolveDevAccountRef } from "@/lib/dev-panel/dev-account-ref";
import type { DevRevokeSubscriptionResult } from "@/lib/dev-panel/types";

/**
 * Revoga (cancela) todas as assinaturas ativas de uma conta a partir do painel
 * dev. A conta volta ao estado sem plano pago ativo. Reversível concedendo
 * novamente (grant) ou via gift key.
 */
export async function revokeDevSubscription(
  accountRef: string
): Promise<DevRevokeSubscriptionResult> {
  await ensurePostgresReady();

  const cpf = await resolveDevAccountRef(accountRef);
  const profile = await findProfileByCpf(cpf);
  if (!profile) {
    throw notFoundError("Conta não encontrada para a referência informada.");
  }

  const cancelled = await cancelActiveSubscriptionsForUser(profile.userId);
  if (cancelled === 0) {
    throw validationError("Nenhuma assinatura ativa para revogar nesta conta.");
  }

  return {
    accountRef,
    cpfLast4: cpf.slice(-4),
    cancelled,
  };
}
