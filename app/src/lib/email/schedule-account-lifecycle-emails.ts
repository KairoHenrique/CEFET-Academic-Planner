import { buildTrialSubscriptionSnapshot } from "@/lib/auth/trial/trial-status";
import { APP_IS_FREE } from "@/lib/billing/free-mode";
import { resolvePlanLabel } from "@/lib/billing/plan-catalog";
import { getPostgresPool } from "@/lib/db/postgres/pool";
import {
  enqueuePlanEndedEmail,
  enqueuePlanExpiringSoonEmail,
  enqueueTrialEndedEmail,
} from "@/lib/email/enqueue-account-email";
import { resolveFirstNames } from "@/lib/email/greeting-name";

/** Faixas de lembrete "plano expirando" (dias). Ordem desc por clareza. */
const EXPIRING_THRESHOLD_DAYS = [7, 3, 1] as const;
/** Janela retroativa para o e-mail "plano encerrado" (evita spam de antigos). */
const ENDED_LOOKBACK_DAYS = 3;
/** Origens que representam plano pago/concedido (exclui trial). */
const PAID_SOURCES = ["pix", "gift_key", "manual"];
const DAY_MS = 24 * 60 * 60 * 1000;

interface TrialLifecycleRow {
  cpf: string;
  trial_started_at: Date;
  user_id: string | null;
  email: string | null;
  aluno_nome: string | null;
}

interface PaidLifecycleRow {
  user_id: string;
  cpf: string;
  email: string | null;
  plan_id: string;
  expires_at: Date;
  aluno_nome: string | null;
}

export async function scheduleTrialLifecycleEmails(
  now = new Date()
): Promise<number> {
  if (APP_IS_FREE) {
    return 0;
  }

  const pool = getPostgresPool();
  const result = await pool.query<TrialLifecycleRow>(
    `SELECT t.cpf, t.trial_started_at, p.user_id, p.email, a.nome AS aluno_nome
     FROM trial_por_cpf t
     LEFT JOIN app_profiles p ON p.cpf = t.cpf
     LEFT JOIN LATERAL (
       SELECT nome FROM aluno WHERE aluno.user_id = p.user_id LIMIT 1
     ) a ON true`
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
      firstNames: resolveFirstNames(row.aluno_nome),
    });

    if (outcome === "queued") {
      scheduled += 1;
    }
  }

  return scheduled;
}

/** Menor faixa (7/3/1) que ainda cobre os dias restantes — dedupe por janela. */
function resolveReminderBucket(daysRemaining: number): number | null {
  const eligible = EXPIRING_THRESHOLD_DAYS.filter(
    (threshold) => threshold >= daysRemaining
  );
  return eligible.length > 0 ? Math.min(...eligible) : null;
}

async function scheduleExpiringSoonEmails(now: Date): Promise<number> {
  const pool = getPostgresPool();
  const result = await pool.query<PaidLifecycleRow>(
    `SELECT s.user_id, p.cpf, p.email, s.plan_id, s.expires_at, a.nome AS aluno_nome
     FROM subscriptions s
     JOIN app_profiles p ON p.user_id = s.user_id
     LEFT JOIN LATERAL (
       SELECT nome FROM aluno WHERE aluno.user_id = s.user_id LIMIT 1
     ) a ON true
     WHERE s.status = 'active'
       AND s.source = ANY($1)
       AND s.expires_at > $2
       AND s.expires_at <= $2 + make_interval(days => $3)`,
    [PAID_SOURCES, now, EXPIRING_THRESHOLD_DAYS[0]]
  );

  let scheduled = 0;

  for (const row of result.rows) {
    if (!row.email) {
      continue;
    }

    const daysRemaining = Math.max(
      1,
      Math.ceil((row.expires_at.getTime() - now.getTime()) / DAY_MS)
    );
    const bucket = resolveReminderBucket(daysRemaining);
    if (bucket === null) {
      continue;
    }

    const outcome = await enqueuePlanExpiringSoonEmail({
      userId: row.user_id,
      cpf: row.cpf,
      toEmail: row.email,
      planLabel: resolvePlanLabel(row.plan_id),
      expiresAt: row.expires_at.toISOString(),
      daysRemaining,
      thresholdDays: bucket,
      firstNames: resolveFirstNames(row.aluno_nome),
    });

    if (outcome === "queued") {
      scheduled += 1;
    }
  }

  return scheduled;
}

async function schedulePlanEndedEmails(now: Date): Promise<number> {
  const pool = getPostgresPool();
  const result = await pool.query<PaidLifecycleRow>(
    `SELECT s.user_id, p.cpf, p.email, s.plan_id, s.expires_at, a.nome AS aluno_nome
     FROM subscriptions s
     JOIN app_profiles p ON p.user_id = s.user_id
     LEFT JOIN LATERAL (
       SELECT nome FROM aluno WHERE aluno.user_id = s.user_id LIMIT 1
     ) a ON true
     WHERE s.source = ANY($1)
       AND s.status IN ('active', 'expired')
       AND s.expires_at <= $2
       AND s.expires_at > $2 - make_interval(days => $3)
       AND NOT EXISTS (
         SELECT 1 FROM subscriptions s2
         WHERE s2.user_id = s.user_id
           AND s2.status = 'active'
           AND s2.expires_at > $2
       )`,
    [PAID_SOURCES, now, ENDED_LOOKBACK_DAYS]
  );

  let scheduled = 0;

  for (const row of result.rows) {
    if (!row.email) {
      continue;
    }

    const outcome = await enqueuePlanEndedEmail({
      userId: row.user_id,
      cpf: row.cpf,
      toEmail: row.email,
      periodKey: row.expires_at.toISOString(),
      firstNames: resolveFirstNames(row.aluno_nome),
    });

    if (outcome === "queued") {
      scheduled += 1;
    }
  }

  return scheduled;
}

export async function schedulePaidPlanLifecycleEmails(
  now = new Date()
): Promise<number> {
  if (APP_IS_FREE) {
    return 0;
  }

  const expiring = await scheduleExpiringSoonEmails(now);
  const ended = await schedulePlanEndedEmails(now);
  return expiring + ended;
}
