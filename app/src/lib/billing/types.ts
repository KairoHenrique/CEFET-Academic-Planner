export type BillingPlanKind = "trial" | "paid";

export type PaidPlanId = "month" | "quarter" | "semester" | "year" | "five_year";

export type BillingPlanId = "trial" | PaidPlanId;

export interface BillingPlanDefinition {
  id: BillingPlanId;
  kind: BillingPlanKind;
  label: string;
  shortLabel: string;
  durationDays: number;
  durationLabel: string;
  description: string;
  purchasable: boolean;
  oncePerCpf: boolean;
  featured: boolean;
  ctaLabel: string;
}

export interface BillingPlanPrice {
  priceCents: number | null;
  priceLabel: string;
  configured: boolean;
}

type BillingPlanBase = Omit<BillingPlanDefinition, "id" | "kind"> & BillingPlanPrice;

export type BillingPlanView =
  | (BillingPlanBase & { kind: "trial"; id: "trial" })
  | (BillingPlanBase & { kind: "paid"; id: PaidPlanId });

export interface BillingPlanSavings {
  percent: number | null;
  label: string | null;
}

/**
 * Promoção ativa exibida na página de planos (gerada no /dev).
 *
 * A promoção é dirigida por preço: o operador define o preço promocional de um
 * plano e a duração; o sistema calcula o percentual, o texto e reverte o preço
 * automaticamente no fim do prazo.
 */
export interface SitePromoPublic {
  /** Selo curto, ex.: "-20%". */
  badge: string | null;
  headline: string;
  description: string;
  /** Plano em promoção (badge no card + já selecionado). */
  highlightPlanId: PaidPlanId;
  /** ISO — quando a promoção termina e o preço volta ao normal. */
  expiresAt: string;
  /** Preço normal do plano (centavos) — exibido riscado. */
  basePriceCents: number;
  /** Preço promocional cobrado no checkout (centavos). */
  promoPriceCents: number;
  /** Percentual de desconto calculado. */
  discountPercent: number;
}

export interface BillingPlansResponse {
  ok: true;
  currency: "BRL";
  checkoutEnabled: boolean;
  trialPolicy: {
    durationDays: number;
    oncePerCpf: true;
    label: string;
  };
  plans: BillingPlanView[];
  /** Promoção ativa no site (banner em /planos); null quando não há. */
  promo: SitePromoPublic | null;
  /** Trimestre vs. 3× mensal (R$ 30 base). */
  quarterSavings: BillingPlanSavings | null;
  /** Semestre vs. 2× trimestre. */
  semesterSavings: BillingPlanSavings | null;
  /** Anual vs. 2× semestre. */
  yearSavings: BillingPlanSavings | null;
  /** 5 anos vs. 5× anual. */
  fiveYearSavings: BillingPlanSavings | null;
}
