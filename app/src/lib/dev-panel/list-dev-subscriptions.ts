import { notFoundError } from "@/lib/api/errors";
import { findProfileByCpf } from "@/lib/auth/account/profile-repository";
import { listSubscriptionsForUser } from "@/lib/billing/checkout/billing-subscription-repository";
import { resolvePlanLabel } from "@/lib/billing/plan-catalog";
import { ensurePostgresReady } from "@/lib/db/bootstrap-postgres";
import { resolveDevAccountRef } from "@/lib/dev-panel/dev-account-ref";
import type { DevSubscriptionHistoryResponse } from "@/lib/dev-panel/types";

/** Histórico de assinaturas de uma conta (leitura para o painel dev). */
export async function listDevSubscriptions(
  accountRef: string
): Promise<DevSubscriptionHistoryResponse> {
  await ensurePostgresReady();

  const cpf = await resolveDevAccountRef(accountRef);
  const profile = await findProfileByCpf(cpf);
  if (!profile) {
    throw notFoundError("Conta não encontrada para a referência informada.");
  }

  const rows = await listSubscriptionsForUser(profile.userId, 20);

  return {
    accountRef,
    cpfLast4: cpf.slice(-4),
    subscriptions: rows.map((row) => ({
      id: row.id,
      planId: row.plan_id,
      planLabel: resolvePlanLabel(row.plan_id),
      status: row.status,
      source: row.source,
      startedAt: row.started_at,
      expiresAt: row.expires_at,
      createdAt: row.created_at,
    })),
  };
}
