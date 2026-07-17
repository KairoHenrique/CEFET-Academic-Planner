import type { AccountEmailKind } from "@/lib/email/account-email-types";
import { buildGreeting } from "@/lib/email/greeting-name";
import { resolveAppUrl } from "@/lib/email/email-links";

interface WelcomeTemplateInput {
  firstNames?: string | null;
}

interface TrialEndedTemplateInput {
  renewHref: string;
  firstNames?: string | null;
}

interface PlanExpiringTemplateInput {
  planLabel: string;
  daysRemaining: number;
  renewHref: string;
  firstNames?: string | null;
}

interface PlanEndedTemplateInput {
  renewHref: string;
  firstNames?: string | null;
}

interface PromotionTemplateInput {
  headline: string;
  message: string;
  firstNames?: string | null;
}

export function buildWelcomeEmail(input: WelcomeTemplateInput) {
  const startHref = resolveAppUrl("/dashboard");

  return {
    subject: "Bem-vindo ao ACME HUB",
    bodyText: [
      buildGreeting(input.firstNames ?? null),
      "",
      "Sua conta no ACME HUB foi criada com sucesso. Seu planejador acadêmico integrado ao SIGAA do CEFET-MG já está pronto.",
      "",
      "Você já pode acompanhar notas e faltas, montar sua grade, ver o mapa de pré-requisitos e a integralização do curso.",
      "",
      "Você tem 7 dias de acesso gratuito para explorar tudo.",
      "",
      startHref,
      "",
      "Equipe ACME HUB",
    ].join("\n"),
  };
}

export function buildTrialEndedEmail(input: TrialEndedTemplateInput) {
  return {
    subject: "Seu acesso gratuito ao ACME HUB terminou",
    bodyText: [
      buildGreeting(input.firstNames ?? null),
      "",
      "Seus 7 dias de acesso gratuito ao ACME HUB chegaram ao fim.",
      "",
      "Para continuar acompanhando notas, faltas, grade e integralização, escolha um plano:",
      "",
      input.renewHref,
      "",
      "Equipe ACME HUB",
    ].join("\n"),
  };
}

export function buildPlanExpiringEmail(input: PlanExpiringTemplateInput) {
  const dayLabel = input.daysRemaining === 1 ? "1 dia" : `${input.daysRemaining} dias`;

  return {
    subject: `Seu ${input.planLabel} expira em ${dayLabel}`,
    bodyText: [
      buildGreeting(input.firstNames ?? null),
      "",
      `Seu ${input.planLabel} no ACME HUB expira em ${dayLabel}.`,
      "",
      "Renove para não perder o acesso:",
      "",
      input.renewHref,
      "",
      "Equipe ACME HUB",
    ].join("\n"),
  };
}

export function buildPlanEndedEmail(input: PlanEndedTemplateInput) {
  return {
    subject: "Seu plano no ACME HUB foi encerrado",
    bodyText: [
      buildGreeting(input.firstNames ?? null),
      "",
      "Seu plano no ACME HUB foi encerrado.",
      "",
      "Renove quando quiser para retomar o acesso completo:",
      "",
      input.renewHref,
      "",
      "Equipe ACME HUB",
    ].join("\n"),
  };
}

export function buildPromotionEmail(input: PromotionTemplateInput) {
  const greeting = buildGreeting(input.firstNames ?? null);

  return {
    subject: input.headline,
    bodyText: [greeting, "", input.message, "", "Equipe ACME HUB"].join("\n"),
  };
}

export function buildAccountEmailDedupeKey(
  kind: AccountEmailKind,
  parts: readonly string[]
): string {
  return [kind, ...parts].join(":");
}
