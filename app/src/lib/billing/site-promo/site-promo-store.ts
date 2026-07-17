import {
  deleteAppConfigJson,
  getAppConfigJson,
  setAppConfigJson,
} from "@/lib/sync-policy/app-config-store";
import type { PaidPlanId, SitePromoPublic } from "@/lib/billing/types";
import {
  parseStoredSitePromo,
  type StoredSitePromo,
} from "@/lib/billing/site-promo/parse-site-promo";

const SITE_PROMO_KEY = "billing.site_promo";

function isExpired(promo: StoredSitePromo, now: Date): boolean {
  return Date.parse(promo.expiresAt) <= now.getTime();
}

function toPublic(promo: StoredSitePromo): SitePromoPublic {
  return {
    badge: `-${promo.discountPercent}%`,
    headline: promo.headline,
    description: promo.description,
    highlightPlanId: promo.planId,
    expiresAt: promo.expiresAt,
    basePriceCents: promo.basePriceCents,
    promoPriceCents: promo.promoPriceCents,
    discountPercent: promo.discountPercent,
  };
}

/** Registro bruto ativo (não expirado); base para preço e banner. */
export async function getActiveStoredSitePromo(
  now = new Date()
): Promise<StoredSitePromo | null> {
  const promo = parseStoredSitePromo(await getAppConfigJson(SITE_PROMO_KEY));
  if (!promo || isExpired(promo, now)) {
    return null;
  }
  return promo;
}

/** Promoção pública para a página de planos; null quando não há/expirou. */
export async function getActiveSitePromo(
  now = new Date()
): Promise<SitePromoPublic | null> {
  const promo = await getActiveStoredSitePromo(now);
  return promo ? toPublic(promo) : null;
}

/** Preço promocional de um plano (centavos) quando há promoção ativa. */
export async function resolveActivePromoPriceCents(
  planId: PaidPlanId,
  now = new Date()
): Promise<number | null> {
  const promo = await getActiveStoredSitePromo(now);
  if (!promo || promo.planId !== planId) {
    return null;
  }
  return promo.promoPriceCents;
}

export async function saveSitePromo(promo: StoredSitePromo): Promise<void> {
  await setAppConfigJson(
    SITE_PROMO_KEY,
    promo as unknown as Record<string, unknown>
  );
}

export async function clearSitePromo(): Promise<void> {
  await deleteAppConfigJson(SITE_PROMO_KEY);
}
