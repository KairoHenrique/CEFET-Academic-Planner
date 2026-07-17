import { PAID_PLAN_IDS } from "@/lib/billing/plan-catalog";
import type { PaidPlanId } from "@/lib/billing/types";

/** Registro persistido no `app_config` — dirigido por preço. */
export interface StoredSitePromo {
  planId: PaidPlanId;
  basePriceCents: number;
  promoPriceCents: number;
  discountPercent: number;
  headline: string;
  description: string;
  /** ISO — fim da promoção (preço reverte). */
  expiresAt: string;
  createdAt: string;
}

const TEXT_MAX = 400;

function isPaidPlanId(value: unknown): value is PaidPlanId {
  return (
    typeof value === "string" &&
    (PAID_PLAN_IDS as readonly string[]).includes(value)
  );
}

function coerceInt(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function coerceText(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }
  return (
    value
      // eslint-disable-next-line no-control-regex
      .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "")
      .trim()
      .slice(0, TEXT_MAX)
  );
}

/** Percentual de desconto inteiro (0..99) a partir dos preços. */
export function computeDiscountPercent(
  basePriceCents: number,
  promoPriceCents: number
): number {
  if (basePriceCents <= 0 || promoPriceCents >= basePriceCents) {
    return 0;
  }
  return Math.round(((basePriceCents - promoPriceCents) / basePriceCents) * 100);
}

/** Normaliza dados vindos do jsonb do `app_config`; null se inválido. */
export function parseStoredSitePromo(raw: unknown): StoredSitePromo | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const record = raw as Record<string, unknown>;

  if (!isPaidPlanId(record.planId)) {
    return null;
  }

  const basePriceCents = coerceInt(record.basePriceCents);
  const promoPriceCents = coerceInt(record.promoPriceCents);
  if (
    basePriceCents === null ||
    promoPriceCents === null ||
    promoPriceCents >= basePriceCents
  ) {
    return null;
  }

  const expiresAtRaw = coerceText(record.expiresAt);
  if (!expiresAtRaw || Number.isNaN(Date.parse(expiresAtRaw))) {
    return null;
  }

  const headline = coerceText(record.headline);
  const description = coerceText(record.description);
  if (!headline || !description) {
    return null;
  }

  return {
    planId: record.planId,
    basePriceCents,
    promoPriceCents,
    discountPercent: computeDiscountPercent(basePriceCents, promoPriceCents),
    headline,
    description,
    expiresAt: expiresAtRaw,
    createdAt: coerceText(record.createdAt) || new Date().toISOString(),
  };
}
