export type BillingPlanKind = "trial" | "paid";

export type PaidPlanId = "quarter" | "semester" | "year" | "five_year";

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

export interface BillingPlanView extends BillingPlanDefinition, BillingPlanPrice {}

export interface BillingPlanSavings {
  percent: number | null;
  label: string | null;
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
  /** Semestre vs. 2× trimestre (R$ 50 base). */
  semesterSavings: BillingPlanSavings | null;
  /** Anual vs. 2× semestre. */
  yearSavings: BillingPlanSavings | null;
  /** 5 anos vs. 5× anual. */
  fiveYearSavings: BillingPlanSavings | null;
}
