import {
  TRIAL_DURATION_DAYS,
  TRIAL_PLAN_ID,
  TRIAL_PLAN_LABEL,
} from "@/lib/auth/trial/constants";
import {
  FIVE_YEAR_DURATION_DAYS,
  MONTH_DURATION_DAYS,
  QUARTER_DURATION_DAYS,
  SEMESTER_DURATION_DAYS,
  YEAR_DURATION_DAYS,
} from "./durations";
import type { BillingPlanDefinition, BillingPlanId, PaidPlanId } from "./types";

export const PAID_PLAN_IDS: readonly PaidPlanId[] = [
  "month",
  "quarter",
  "semester",
  "year",
  "five_year",
] as const;

export const BILLING_PLAN_DEFINITIONS: readonly BillingPlanDefinition[] = [
  {
    id: TRIAL_PLAN_ID,
    kind: "trial",
    label: TRIAL_PLAN_LABEL,
    shortLabel: "Trial",
    durationDays: TRIAL_DURATION_DAYS,
    durationLabel: `${TRIAL_DURATION_DAYS} dias · uma vez por CPF`,
    description: "Período de teste gratuito na criação da conta.",
    purchasable: false,
    oncePerCpf: true,
    featured: false,
    ctaLabel: "Incluído no cadastro",
  },
  {
    id: "month",
    kind: "paid",
    label: "Plano mensal",
    shortLabel: "1 mês",
    durationDays: MONTH_DURATION_DAYS,
    durationLabel: "30 dias",
    description: "Entrada flexível — ideal para continuar após o trial.",
    purchasable: true,
    oncePerCpf: false,
    featured: false,
    ctaLabel: "Assinar via PIX",
  },
  {
    id: "quarter",
    kind: "paid",
    label: "Plano trimestre",
    shortLabel: "3 meses",
    durationDays: QUARTER_DURATION_DAYS,
    durationLabel: "3 meses",
    description: "Desconto vs. 3 planos mensais.",
    purchasable: true,
    oncePerCpf: false,
    featured: false,
    ctaLabel: "Assinar via PIX",
  },
  {
    id: "semester",
    kind: "paid",
    label: "Plano semestre",
    shortLabel: "6 meses",
    durationDays: SEMESTER_DURATION_DAYS,
    durationLabel: "6 meses",
    description: "Melhor custo no semestre — desconto vs. 2 trimestres.",
    purchasable: true,
    oncePerCpf: false,
    featured: true,
    ctaLabel: "Assinar via PIX",
  },
  {
    id: "year",
    kind: "paid",
    label: "Plano anual",
    shortLabel: "1 ano",
    durationDays: YEAR_DURATION_DAYS,
    durationLabel: "12 meses",
    description: "Melhor custo para quem usa o app o ano todo.",
    purchasable: true,
    oncePerCpf: false,
    featured: false,
    ctaLabel: "Assinar via PIX",
  },
  {
    id: "five_year",
    kind: "paid",
    label: "Plano 5 anos",
    shortLabel: "5 anos",
    durationDays: FIVE_YEAR_DURATION_DAYS,
    durationLabel: "5 anos",
    description: "Cobertura para a graduação inteira — desconto vs. 5 anuais.",
    purchasable: true,
    oncePerCpf: false,
    featured: false,
    ctaLabel: "Assinar via PIX",
  },
] as const;

export function getBillingPlanDefinition(
  planId: BillingPlanId
): BillingPlanDefinition | null {
  return BILLING_PLAN_DEFINITIONS.find((plan) => plan.id === planId) ?? null;
}

export function resolvePlanLabel(planId: string): string {
  return getBillingPlanDefinition(planId as BillingPlanId)?.label ?? planId;
}

export function resolvePlanDurationDays(planId: string): number {
  const plan = getBillingPlanDefinition(planId as BillingPlanId);
  if (plan) {
    return plan.durationDays;
  }

  if (planId === "month") {
    return MONTH_DURATION_DAYS;
  }

  if (planId === "quarter") {
    return QUARTER_DURATION_DAYS;
  }

  if (planId === "semester") {
    return SEMESTER_DURATION_DAYS;
  }

  if (planId === "year") {
    return YEAR_DURATION_DAYS;
  }

  if (planId === "five_year") {
    return FIVE_YEAR_DURATION_DAYS;
  }

  return TRIAL_DURATION_DAYS;
}
