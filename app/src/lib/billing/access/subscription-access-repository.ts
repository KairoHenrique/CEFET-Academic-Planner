import { getPostgresPool } from "@/lib/db/postgres/pool";
import type { SubscriptionRow } from "@/lib/billing/schema/billing-row-types";
import type { PaidPlanId } from "@/lib/billing/types";
import {
  computeGracePeriodEndsAt,
  resolveGracePeriodDays,
} from "@/lib/billing/renewal/resolve-grace-period-days";

interface SubscriptionDbRow {
  id: string;
  user_id: string;
  plan_id: PaidPlanId;
  status: SubscriptionRow["status"];
  source: SubscriptionRow["source"];
  started_at: Date;
  expires_at: Date;
  created_at: Date;
  updated_at: Date;
}

function mapSubscriptionRow(row: SubscriptionDbRow): SubscriptionRow {
  return {
    id: row.id,
    user_id: row.user_id,
    plan_id: row.plan_id,
    status: row.status,
    source: row.source,
    started_at: row.started_at.toISOString(),
    expires_at: row.expires_at.toISOString(),
    created_at: row.created_at.toISOString(),
    updated_at: row.updated_at.toISOString(),
  };
}

const SUBSCRIPTION_BY_CPF = `
  SELECT s.id, s.user_id, s.plan_id, s.status, s.source, s.started_at,
         s.expires_at, s.created_at, s.updated_at
  FROM subscriptions s
  INNER JOIN app_profiles p ON p.user_id = s.user_id
  WHERE p.cpf = $1
`;

export async function expireSubscriptionsPastGraceForCpf(
  cpf: string,
  now = new Date()
): Promise<void> {
  const graceDays = resolveGracePeriodDays();
  if (graceDays <= 0) {
    return;
  }

  const pool = getPostgresPool();
  await pool.query(
    `UPDATE subscriptions s
     SET status = 'expired', updated_at = now()
     FROM app_profiles p
     WHERE p.user_id = s.user_id
       AND p.cpf = $1
       AND s.status = 'active'
       AND s.expires_at <= $2
       AND s.expires_at + ($3 || ' days')::interval <= $2`,
    [cpf, now.toISOString(), String(graceDays)]
  );
}

export async function findActiveSubscriptionByCpf(
  cpf: string,
  now = new Date()
): Promise<SubscriptionRow | null> {
  const graceDays = resolveGracePeriodDays();
  const pool = getPostgresPool();
  const result = await pool.query<SubscriptionDbRow>(
    `${SUBSCRIPTION_BY_CPF}
     AND s.status = 'active'
     AND (
       s.expires_at > $2
       OR (
         $3::int > 0
         AND s.expires_at <= $2
         AND s.expires_at + ($3 || ' days')::interval > $2
       )
     )
     ORDER BY s.expires_at DESC
     LIMIT 1`,
    [cpf, now.toISOString(), String(graceDays)]
  );

  const row = result.rows[0];
  return row ? mapSubscriptionRow(row) : null;
}

export async function findPendingPaymentSubscriptionByCpf(
  cpf: string
): Promise<SubscriptionRow | null> {
  const pool = getPostgresPool();
  const result = await pool.query<SubscriptionDbRow>(
    `${SUBSCRIPTION_BY_CPF}
     AND s.status = 'pending_payment'
     ORDER BY s.created_at DESC
     LIMIT 1`,
    [cpf]
  );

  const row = result.rows[0];
  return row ? mapSubscriptionRow(row) : null;
}

export async function findLatestExpiredPaidSubscriptionByCpf(
  cpf: string,
  now = new Date()
): Promise<SubscriptionRow | null> {
  const graceDays = resolveGracePeriodDays();
  const pool = getPostgresPool();
  const result = await pool.query<SubscriptionDbRow>(
    `${SUBSCRIPTION_BY_CPF}
     AND (
       s.status IN ('expired', 'cancelled')
       OR (
         s.status = 'active'
         AND s.expires_at <= $2
         AND (
           $3::int = 0
           OR s.expires_at + ($3 || ' days')::interval <= $2
         )
       )
     )
     ORDER BY s.expires_at DESC
     LIMIT 1`,
    [cpf, now.toISOString(), String(graceDays)]
  );

  const row = result.rows[0];
  return row ? mapSubscriptionRow(row) : null;
}

export async function userHasRenewableSubscription(
  cpf: string,
  now = new Date()
): Promise<boolean> {
  const expired = await findLatestExpiredPaidSubscriptionByCpf(cpf, now);
  if (expired) {
    return true;
  }

  const active = await findActiveSubscriptionByCpf(cpf, now);
  return active != null;
}

export function resolveAccessExpiryMetrics(
  subscriptionExpiresAt: string,
  now = new Date()
): { expiresAt: string; daysRemaining: number; inGracePeriod: boolean } {
  const graceDays = resolveGracePeriodDays();
  const expiresMs = Date.parse(subscriptionExpiresAt);

  if (expiresMs > now.getTime()) {
    const daysRemaining = Math.ceil(
      (expiresMs - now.getTime()) / (24 * 60 * 60 * 1000)
    );
    return {
      expiresAt: subscriptionExpiresAt,
      daysRemaining,
      inGracePeriod: false,
    };
  }

  if (graceDays <= 0) {
    return { expiresAt: subscriptionExpiresAt, daysRemaining: 0, inGracePeriod: false };
  }

  const graceEndsAt = computeGracePeriodEndsAt(subscriptionExpiresAt, graceDays);
  const graceRemainingMs = graceEndsAt.getTime() - now.getTime();

  if (graceRemainingMs <= 0) {
    return { expiresAt: subscriptionExpiresAt, daysRemaining: 0, inGracePeriod: false };
  }

  return {
    expiresAt: graceEndsAt.toISOString(),
    daysRemaining: Math.ceil(graceRemainingMs / (24 * 60 * 60 * 1000)),
    inGracePeriod: true,
  };
}
