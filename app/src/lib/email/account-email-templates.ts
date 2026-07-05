import type { AccountEmailKind } from "@/lib/email/account-email-types";

interface WelcomeTemplateInput {
  contactEmail: string;
}

interface TrialEndedTemplateInput {
  renewHref: string;
}

interface PlanExpiringTemplateInput {
  planLabel: string;
  daysRemaining: number;
  renewHref: string;
}

interface PlanEndedTemplateInput {
  renewHref: string;
}

interface PromotionTemplateInput {
  headline: string;
  message: string;
}

export function buildWelcomeEmail(input: WelcomeTemplateInput) {
  return {
    subject: "Bem-vindo ao ACME HUB",
    bodyText: [
      "Olá!",
      "",
      "Sua conta no ACME HUB foi criada com sucesso.",
      `E-mail de contato: ${input.contactEmail}`,
      "",
      "Você tem 7 dias de trial gratuito para explorar o planejador acadêmico.",
      "",
      "Equipe ACME HUB",
    ].join("\n"),
  };
}

export function buildTrialEndedEmail(input: TrialEndedTemplateInput) {
  return {
    subject: "Seu trial gratuito terminou",
    bodyText: [
      "Olá!",
      "",
      "Os 7 dias de trial do ACME HUB chegaram ao fim.",
      `Renove seu acesso em: ${input.renewHref}`,
      "",
      "Equipe ACME HUB",
    ].join("\n"),
  };
}

export function buildPlanExpiringEmail(input: PlanExpiringTemplateInput) {
  return {
    subject: `Seu ${input.planLabel} expira em ${input.daysRemaining} dia(s)`,
    bodyText: [
      "Olá!",
      "",
      `Seu ${input.planLabel} no ACME HUB expira em ${input.daysRemaining} dia(s).`,
      `Renove em: ${input.renewHref}`,
      "",
      "Equipe ACME HUB",
    ].join("\n"),
  };
}

export function buildPlanEndedEmail(input: PlanEndedTemplateInput) {
  return {
    subject: "Seu plano ACME HUB foi encerrado",
    bodyText: [
      "Olá!",
      "",
      "Seu plano no ACME HUB foi encerrado.",
      `Renove em: ${input.renewHref}`,
      "",
      "Equipe ACME HUB",
    ].join("\n"),
  };
}

export function buildPromotionEmail(input: PromotionTemplateInput) {
  return {
    subject: input.headline,
    bodyText: [input.headline, "", input.message, "", "Equipe ACME HUB"].join(
      "\n"
    ),
  };
}

export function buildAccountEmailDedupeKey(
  kind: AccountEmailKind,
  parts: readonly string[]
): string {
  return [kind, ...parts].join(":");
}
