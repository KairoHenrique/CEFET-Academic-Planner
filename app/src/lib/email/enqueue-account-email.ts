import type { AppProfileRecord } from "@/lib/auth/account/types";
import {
  buildAccountEmailDedupeKey,
  buildPlanEndedEmail,
  buildPlanExpiringEmail,
  buildPromotionEmail,
  buildSupportPaymentNotifyEmail,
  buildSupportRegisterNotifyEmail,
  buildTrialEndedEmail,
  buildWelcomeEmail,
} from "@/lib/email/account-email-templates";
import { enqueueAccountEmail } from "@/lib/email/account-email-queue-repository";
import { resolveRenewUrl } from "@/lib/email/email-links";
import {
  maskCpfForSupport,
  resolveSupportNotifyEmail,
} from "@/lib/email/support-notify";

export async function enqueueWelcomeAccountEmail(
  profile: AppProfileRecord,
  firstNames?: string | null
): Promise<"queued" | "duplicate"> {
  const template = buildWelcomeEmail({ firstNames });

  return enqueueAccountEmail({
    userId: profile.userId,
    cpf: profile.cpf,
    toEmail: profile.email,
    kind: "welcome",
    dedupeKey: buildAccountEmailDedupeKey("welcome", [profile.userId]),
    subject: template.subject,
    bodyText: template.bodyText,
  });
}

export async function enqueueTrialEndedEmail(input: {
  userId: string | null;
  cpf: string;
  toEmail: string;
  trialStartedAt: string;
  firstNames?: string | null;
}): Promise<"queued" | "duplicate"> {
  const template = buildTrialEndedEmail({
    renewHref: resolveRenewUrl(),
    firstNames: input.firstNames,
  });

  return enqueueAccountEmail({
    userId: input.userId,
    cpf: input.cpf,
    toEmail: input.toEmail,
    kind: "trial_ended",
    dedupeKey: buildAccountEmailDedupeKey("trial_ended", [
      input.cpf,
      input.trialStartedAt,
    ]),
    subject: template.subject,
    bodyText: template.bodyText,
  });
}

export async function enqueuePlanExpiringSoonEmail(input: {
  userId: string | null;
  cpf: string;
  toEmail: string;
  planLabel: string;
  expiresAt: string;
  daysRemaining: number;
  /** Faixa do lembrete (7/3/1) — evita reenvio diário dentro da mesma janela. */
  thresholdDays: number;
  firstNames?: string | null;
}): Promise<"queued" | "duplicate"> {
  const template = buildPlanExpiringEmail({
    planLabel: input.planLabel,
    daysRemaining: input.daysRemaining,
    renewHref: resolveRenewUrl(),
    firstNames: input.firstNames,
  });

  return enqueueAccountEmail({
    userId: input.userId,
    cpf: input.cpf,
    toEmail: input.toEmail,
    kind: "plan_expiring_soon",
    dedupeKey: buildAccountEmailDedupeKey("plan_expiring_soon", [
      input.cpf,
      input.expiresAt,
      String(input.thresholdDays),
    ]),
    subject: template.subject,
    bodyText: template.bodyText,
  });
}

export async function enqueuePlanEndedEmail(input: {
  userId: string | null;
  cpf: string;
  toEmail: string;
  periodKey: string;
  firstNames?: string | null;
}): Promise<"queued" | "duplicate"> {
  const template = buildPlanEndedEmail({
    renewHref: resolveRenewUrl(),
    firstNames: input.firstNames,
  });

  return enqueueAccountEmail({
    userId: input.userId,
    cpf: input.cpf,
    toEmail: input.toEmail,
    kind: "plan_ended",
    dedupeKey: buildAccountEmailDedupeKey("plan_ended", [
      input.cpf,
      input.periodKey,
    ]),
    subject: template.subject,
    bodyText: template.bodyText,
  });
}

export async function enqueuePromotionAccountEmail(input: {
  userId: string | null;
  cpf: string;
  toEmail: string;
  campaignId: string;
  headline: string;
  message: string;
  firstNames?: string | null;
}): Promise<"queued" | "duplicate"> {
  const template = buildPromotionEmail({
    headline: input.headline,
    message: input.message,
    firstNames: input.firstNames,
  });

  return enqueueAccountEmail({
    userId: input.userId,
    cpf: input.cpf,
    toEmail: input.toEmail,
    kind: "promotion",
    dedupeKey: buildAccountEmailDedupeKey("promotion", [
      input.campaignId,
      input.cpf,
    ]),
    subject: template.subject,
    bodyText: template.bodyText,
  });
}

/** Aviso interno — novo cadastro (site ou app). */
export async function enqueueSupportRegisterNotifyEmail(
  profile: AppProfileRecord
): Promise<"queued" | "duplicate"> {
  const template = buildSupportRegisterNotifyEmail({
    maskedCpf: maskCpfForSupport(profile.cpf),
    contactEmail: profile.email,
    cursoId: profile.cursoId,
  });

  return enqueueAccountEmail({
    userId: profile.userId,
    cpf: profile.cpf,
    toEmail: resolveSupportNotifyEmail(),
    kind: "support_notify",
    dedupeKey: buildAccountEmailDedupeKey("support_notify", [
      "register",
      profile.userId,
    ]),
    subject: template.subject,
    bodyText: template.bodyText,
  });
}

/** Aviso interno — pagamento aprovado + plano ativado. */
export async function enqueueSupportPaymentNotifyEmail(input: {
  userId: string;
  cpf: string;
  contactEmail: string | null;
  planId: string;
  amountCents: number;
  paymentId: string;
}): Promise<"queued" | "duplicate"> {
  const template = buildSupportPaymentNotifyEmail({
    maskedCpf: maskCpfForSupport(input.cpf),
    contactEmail: input.contactEmail,
    planId: input.planId,
    amountCents: input.amountCents,
    paymentId: input.paymentId,
  });

  return enqueueAccountEmail({
    userId: input.userId,
    cpf: input.cpf,
    toEmail: resolveSupportNotifyEmail(),
    kind: "support_notify",
    dedupeKey: buildAccountEmailDedupeKey("support_notify", [
      "payment",
      input.paymentId,
    ]),
    subject: template.subject,
    bodyText: template.bodyText,
  });
}
