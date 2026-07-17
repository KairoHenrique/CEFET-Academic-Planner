import { randomUUID } from "node:crypto";
import { ensurePostgresReady } from "@/lib/db/bootstrap-postgres";
import { isPostgresBackend } from "@/lib/db/backend/config";
import { validationError } from "@/lib/api/errors";
import { resolveBillingPriceCents } from "@/lib/billing/resolve-plan-prices";
import { buildPromoCopy } from "@/lib/billing/site-promo/build-promo-copy";
import { computeDiscountPercent } from "@/lib/billing/site-promo/parse-site-promo";
import { saveSitePromo } from "@/lib/billing/site-promo/site-promo-store";
import type { PaidPlanId } from "@/lib/billing/types";
import { enqueuePromotionAccountEmail } from "@/lib/email/enqueue-account-email";
import { resolveFirstNames } from "@/lib/email/greeting-name";
import { runAccountEmailCron } from "@/lib/email/run-account-email-cron";
import { resolvePromotionTargets } from "@/lib/dev-panel/promotion-targets";
import type {
  DevPromotionRequest,
  DevPromotionResult,
} from "@/lib/dev-panel/types";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Publica uma promoção global: grava o preço promocional (banner + checkout),
 * calcula o percentual e os textos, e dispara o e-mail de campanha para todas
 * as contas. O preço reverte sozinho quando a promoção expira.
 */
export async function dispatchPromotion(
  input: DevPromotionRequest,
  now = new Date()
): Promise<DevPromotionResult> {
  if (isPostgresBackend()) {
    await ensurePostgresReady();
  }

  const planId = input.planId as PaidPlanId;
  const basePriceCents = resolveBillingPriceCents(planId);
  if (input.promoPriceCents >= basePriceCents) {
    throw validationError(
      "Preço promocional deve ser menor que o preço atual do plano.",
      { basePriceCents }
    );
  }

  const discountPercent = computeDiscountPercent(
    basePriceCents,
    input.promoPriceCents
  );
  const expiresAt = new Date(
    now.getTime() + input.durationDays * DAY_MS
  ).toISOString();
  const copy = buildPromoCopy({
    planId,
    basePriceCents,
    promoPriceCents: input.promoPriceCents,
    discountPercent,
    expiresAt,
  });

  await saveSitePromo({
    planId,
    basePriceCents,
    promoPriceCents: input.promoPriceCents,
    discountPercent,
    headline: copy.headline,
    description: copy.description,
    expiresAt,
    createdAt: now.toISOString(),
  });

  const campaignId = randomUUID();
  const targets = await resolvePromotionTargets({ scope: "global" });

  let queued = 0;
  for (const target of targets) {
    const outcome = await enqueuePromotionAccountEmail({
      userId: target.userId,
      cpf: target.cpf,
      toEmail: target.email,
      campaignId,
      headline: copy.emailHeadline,
      message: copy.emailMessage,
      firstNames: resolveFirstNames(target.fullName),
    });

    if (outcome === "queued") {
      queued += 1;
    }
  }

  const delivery = queued > 0 ? await runAccountEmailCron() : null;

  return {
    campaignId,
    planId,
    basePriceCents,
    promoPriceCents: input.promoPriceCents,
    discountPercent,
    expiresAt,
    targets: targets.length,
    queued,
    sent: delivery?.sent ?? 0,
    failed: delivery?.failed ?? 0,
    provider: delivery?.provider ?? "stub",
  };
}
