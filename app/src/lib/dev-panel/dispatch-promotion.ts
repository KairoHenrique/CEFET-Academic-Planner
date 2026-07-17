import { randomUUID } from "node:crypto";
import { ensurePostgresReady } from "@/lib/db/bootstrap-postgres";
import { isPostgresBackend } from "@/lib/db/backend/config";
import { enqueuePromotionAccountEmail } from "@/lib/email/enqueue-account-email";
import { resolveFirstNames } from "@/lib/email/greeting-name";
import { runAccountEmailCron } from "@/lib/email/run-account-email-cron";
import { resolvePromotionTargets } from "@/lib/dev-panel/promotion-targets";
import type {
  DevPromotionRequest,
  DevPromotionResult,
} from "@/lib/dev-panel/types";

/**
 * Enfileira uma campanha de promoção para as contas-alvo e faz um flush
 * imediato da fila de e-mail (mesma rotina do cron). Campanhas grandes que
 * excederem o lote do cron seguem sendo enviadas pelo cron agendado.
 */
export async function dispatchPromotion(
  input: DevPromotionRequest
): Promise<DevPromotionResult> {
  if (isPostgresBackend()) {
    await ensurePostgresReady();
  }

  const campaignId = randomUUID();
  const targets = await resolvePromotionTargets({
    scope: input.scope,
    accountRef: input.accountRef,
  });

  let queued = 0;
  for (const target of targets) {
    const outcome = await enqueuePromotionAccountEmail({
      userId: target.userId,
      cpf: target.cpf,
      toEmail: target.email,
      campaignId,
      headline: input.headline,
      message: input.message,
      firstNames: resolveFirstNames(target.fullName),
    });

    if (outcome === "queued") {
      queued += 1;
    }
  }

  const delivery = queued > 0 ? await runAccountEmailCron() : null;

  return {
    campaignId,
    targets: targets.length,
    queued,
    sent: delivery?.sent ?? 0,
    failed: delivery?.failed ?? 0,
    provider: delivery?.provider ?? "stub",
  };
}
