import { ensurePostgresReady } from "@/lib/db/bootstrap-postgres";
import { createBrevoAccountEmailSender } from "@/lib/email/brevo-account-email-sender";
import { resolveBrevoConfig } from "@/lib/email/brevo-config";
import {
  createHomeWorkerEmailSender,
  resolveHomeWorkerEmailDispatchConfig,
} from "@/lib/email/home-worker-email-sender";
import {
  processAccountEmailQueue,
  type AccountEmailSender,
} from "@/lib/email/process-account-email-queue";
import { createResendAccountEmailSender } from "@/lib/email/resend-account-email-sender";
import { resolveResendConfig } from "@/lib/email/resend-config";
import {
  schedulePaidPlanLifecycleEmails,
  scheduleTrialLifecycleEmails,
} from "@/lib/email/schedule-account-lifecycle-emails";

export type AccountEmailProvider =
  | "home-gmail"
  | "brevo"
  | "resend"
  | "stub";

export interface AccountEmailCronResult {
  scheduled: number;
  processed: number;
  sent: number;
  failed: number;
  retried: number;
  provider: AccountEmailProvider;
}

/**
 * Prioridade: home-gmail (PC + SMTP Gmail, entrega real) → Brevo → Resend → stub.
 * Home-gmail exige ACCOUNT_EMAIL_VIA_HOME_WORKER=true no cloud + Gmail no .env do PC.
 */
function resolveAccountEmailSender(): {
  sender: AccountEmailSender | undefined;
  provider: AccountEmailProvider;
} {
  const home = resolveHomeWorkerEmailDispatchConfig();
  if (home) {
    return {
      sender: createHomeWorkerEmailSender(home),
      provider: "home-gmail",
    };
  }

  const brevo = resolveBrevoConfig();
  if (brevo) {
    return { sender: createBrevoAccountEmailSender(brevo), provider: "brevo" };
  }

  const resend = resolveResendConfig();
  if (resend) {
    return { sender: createResendAccountEmailSender(resend), provider: "resend" };
  }

  return { sender: undefined, provider: "stub" };
}

export async function runAccountEmailCron(): Promise<AccountEmailCronResult> {
  await ensurePostgresReady();

  const trialScheduled = await scheduleTrialLifecycleEmails();
  const planScheduled = await schedulePaidPlanLifecycleEmails();

  const { sender, provider } = resolveAccountEmailSender();
  const delivery = await processAccountEmailQueue(sender);

  return {
    scheduled: trialScheduled + planScheduled,
    processed: delivery.processed,
    sent: delivery.sent,
    failed: delivery.failed,
    retried: delivery.retried,
    provider,
  };
}
