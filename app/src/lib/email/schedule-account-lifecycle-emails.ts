import { getPostgresPool } from "@/lib/db/postgres/pool";
import {
  buildTrialSubscriptionSnapshot,
} from "@/lib/auth/trial/trial-status";
import { enqueueTrialEndedEmail } from "@/lib/email/enqueue-account-email";

interface TrialLifecycleRow {
  cpf: string;
  trial_started_at: Date;
  user_id: string | null;
  email: string | null;
}

export async function scheduleTrialLifecycleEmails(
  now = new Date()
): Promise<number> {
  const pool = getPostgresPool();
  const result = await pool.query<TrialLifecycleRow>(
    `SELECT t.cpf, t.trial_started_at, p.user_id, p.email
     FROM trial_por_cpf t
     LEFT JOIN app_profiles p ON p.cpf = t.cpf`
  );

  let scheduled = 0;

  for (const row of result.rows) {
    if (!row.email) {
      continue;
    }

    const snapshot = buildTrialSubscriptionSnapshot(row.trial_started_at, now);

    if (snapshot.status !== "trial_expired") {
      continue;
    }

    const outcome = await enqueueTrialEndedEmail({
      userId: row.user_id,
      cpf: row.cpf,
      toEmail: row.email,
      trialStartedAt: row.trial_started_at.toISOString(),
    });

    if (outcome === "queued") {
      scheduled += 1;
    }
  }

  return scheduled;
}

export async function schedulePaidPlanLifecycleEmails(): Promise<number> {
  // Bloco 7 (PIX) persistirá assinaturas pagas; fila já expõe enqueuePlanEndedEmail.
  return 0;
}
