import { ensurePostgresReady } from "@/lib/db/bootstrap-postgres";
import { processAccountEmailQueue } from "@/lib/email/process-account-email-queue";
import {
  schedulePaidPlanLifecycleEmails,
  scheduleTrialLifecycleEmails,
} from "@/lib/email/schedule-account-lifecycle-emails";

export interface AccountEmailCronResult {
  scheduled: number;
  processed: number;
  sent: number;
  failed: number;
}

export async function runAccountEmailCron(): Promise<AccountEmailCronResult> {
  await ensurePostgresReady();

  const trialScheduled = await scheduleTrialLifecycleEmails();
  const planScheduled = await schedulePaidPlanLifecycleEmails();
  const delivery = await processAccountEmailQueue();

  return {
    scheduled: trialScheduled + planScheduled,
    processed: delivery.processed,
    sent: delivery.sent,
    failed: delivery.failed,
  };
}
