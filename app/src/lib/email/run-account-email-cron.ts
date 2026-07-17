import { ensurePostgresReady } from "@/lib/db/bootstrap-postgres";
import { createBrevoAccountEmailSender } from "@/lib/email/brevo-account-email-sender";
import { resolveBrevoConfig } from "@/lib/email/brevo-config";
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

export type AccountEmailProvider = "brevo" | "resend" | "stub";

export interface AccountEmailCronResult {
  scheduled: number;
  processed: number;
  sent: number;
  failed: number;
  retried: number;
  provider: AccountEmailProvider;
}

/**
 * Seleciona o provedor conforme os secrets disponíveis: Brevo (grátis, sem
 * domínio) → Resend (requer domínio) → stub de log (dev/local sem secret).
 */
function resolveAccountEmailSender(): {
  sender: AccountEmailSender | undefined;
  provider: AccountEmailProvider;
} {
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
