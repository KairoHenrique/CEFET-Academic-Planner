import { formatBrlCents } from "@/lib/billing/format-brl-cents";
import { resolvePlanLabel } from "@/lib/billing/plan-catalog";
import { resolveAppUrl } from "@/lib/email/email-links";
import type { PaidPlanId } from "@/lib/billing/types";

interface PromoCopyInput {
  planId: PaidPlanId;
  basePriceCents: number;
  promoPriceCents: number;
  discountPercent: number;
  expiresAt: string;
}

export interface PromoCopy {
  /** Selo curto do banner. */
  badge: string;
  /** Título do banner na /planos. */
  headline: string;
  /** Descrição do banner (de X por Y, prazo). */
  description: string;
  /** Assunto do e-mail de campanha. */
  emailHeadline: string;
  /** Corpo do e-mail (sem saudação — o template adiciona). */
  emailMessage: string;
}

function formatDeadline(expiresAt: string): string {
  const parsed = Date.parse(expiresAt);
  if (Number.isNaN(parsed)) {
    return "";
  }
  return new Date(parsed).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });
}

/**
 * Gera automaticamente os textos da promoção (banner + e-mail) a partir do
 * plano, preços e prazo. Sem entrada de texto livre do operador (menos atrito e
 * mensagens sempre consistentes com o desconto real).
 */
export function buildPromoCopy(input: PromoCopyInput): PromoCopy {
  const planLabel = resolvePlanLabel(input.planId);
  const baseLabel = formatBrlCents(input.basePriceCents);
  const promoLabel = formatBrlCents(input.promoPriceCents);
  const deadline = formatDeadline(input.expiresAt);
  const untilText = deadline ? ` Válido até ${deadline}.` : "";
  const plansUrl = resolveAppUrl("/planos");

  const badge = `-${input.discountPercent}%`;
  const headline = `${planLabel} com ${input.discountPercent}% de desconto`;
  const description = `De ${baseLabel} por ${promoLabel} no ${planLabel.toLowerCase()}.${untilText}`;

  const emailHeadline = `Oferta: ${planLabel} com ${input.discountPercent}% OFF`;
  const emailMessage = [
    `Estamos com uma promoção no ${planLabel}: de ${baseLabel} por ${promoLabel} (${input.discountPercent}% de desconto).`,
    deadline ? `A oferta vai até ${deadline}. Garanta o seu:` : "Garanta o seu:",
    "",
    plansUrl,
  ].join("\n");

  return { badge, headline, description, emailHeadline, emailMessage };
}
