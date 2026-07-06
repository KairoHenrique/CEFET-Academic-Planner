import { getPostgresPool } from "@/lib/db/postgres/pool";
import { computePaidSubscriptionExpiresAt } from "@/lib/billing/subscription/compute-subscription-expires-at";
import type { SubscriptionRow } from "@/lib/billing/schema/billing-row-types";
import type { PaidPlanId } from "@/lib/billing/types";

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

const SUBSCRIPTION_SELECT = `
  SELECT id, user_id, plan_id, status, source, started_at, expires_at,
         created_at, updated_at
  FROM subscriptions
`;

export async function findSubscriptionById(
  subscriptionId: string
): Promise<SubscriptionRow | null> {
  const pool = getPostgresPool();
  const result = await pool.query<SubscriptionDbRow>(
    `${SUBSCRIPTION_SELECT}
     WHERE id = $1
     LIMIT 1`,
    [subscriptionId]
  );

  const row = result.rows[0];
  return row ? mapSubscriptionRow(row) : null;
}

export async function insertPendingPixSubscription(input: {
  userId: string;
  planId: PaidPlanId;
  durationDays: number;
}): Promise<SubscriptionRow> {
  const pool = getPostgresPool();
  const result = await pool.query<SubscriptionDbRow>(
    `INSERT INTO subscriptions (
       user_id, plan_id, status, source, expires_at
     ) VALUES (
       $1, $2, 'pending_payment', 'pix',
       now() + ($3 || ' days')::interval
     )
     RETURNING id, user_id, plan_id, status, source, started_at, expires_at,
               created_at, updated_at`,
    [input.userId, input.planId, String(input.durationDays)]
  );

  const row = result.rows[0];
  if (!row) {
    throw new Error("Falha ao criar assinatura pendente.");
  }

  return mapSubscriptionRow(row);
}

export async function findLatestActiveSubscriptionForUser(
  userId: string,
  excludeSubscriptionId?: string
): Promise<SubscriptionRow | null> {
  const pool = getPostgresPool();
  const result = await pool.query<SubscriptionDbRow>(
    `${SUBSCRIPTION_SELECT}
     WHERE user_id = $1
       AND status = 'active'
       AND ($2::uuid IS NULL OR id <> $2)
     ORDER BY expires_at DESC
     LIMIT 1`,
    [userId, excludeSubscriptionId ?? null]
  );

  const row = result.rows[0];
  return row ? mapSubscriptionRow(row) : null;
}

export async function expireOtherActiveSubscriptions(input: {
  userId: string;
  keepSubscriptionId: string;
}): Promise<void> {
  const pool = getPostgresPool();
  await pool.query(
    `UPDATE subscriptions
     SET status = 'expired', updated_at = now()
     WHERE user_id = $1
       AND status = 'active'
       AND id <> $2`,
    [input.userId, input.keepSubscriptionId]
  );
}

export async function activateSubscriptionAfterPayment(input: {
  subscriptionId: string;
  userId: string;
  durationDays: number;
}): Promise<SubscriptionRow> {
  const expiresAt = await computePaidSubscriptionExpiresAt({
    userId: input.userId,
    durationDays: input.durationDays,
    excludeSubscriptionId: input.subscriptionId,
  });

  const pool = getPostgresPool();
  const result = await pool.query<SubscriptionDbRow>(
    `UPDATE subscriptions
     SET status = 'active',
         started_at = now(),
         expires_at = $3,
         updated_at = now()
     WHERE id = $1
     RETURNING id, user_id, plan_id, status, source, started_at, expires_at,
               created_at, updated_at`,
    [input.subscriptionId, expiresAt.toISOString()]
  );

  const row = result.rows[0];
  if (!row) {
    throw new Error("Assinatura não encontrada para ativação.");
  }

  await expireOtherActiveSubscriptions({
    userId: input.userId,
    keepSubscriptionId: input.subscriptionId,
  });

  return mapSubscriptionRow(row);
}

export async function insertActiveGiftSubscription(input: {
  userId: string;
  planId: PaidPlanId;
  durationDays: number;
  expiresAt: Date;
}): Promise<SubscriptionRow> {
  const pool = getPostgresPool();
  const result = await pool.query<SubscriptionDbRow>(
    `INSERT INTO subscriptions (
       user_id, plan_id, status, source, expires_at
     ) VALUES (
       $1, $2, 'active', 'gift_key', $3
     )
     RETURNING id, user_id, plan_id, status, source, started_at, expires_at,
               created_at, updated_at`,
    [input.userId, input.planId, input.expiresAt.toISOString()]
  );

  const row = result.rows[0];
  if (!row) {
    throw new Error("Falha ao criar assinatura via chave gift.");
  }

  await expireOtherActiveSubscriptions({
    userId: input.userId,
    keepSubscriptionId: row.id,
  });

  return mapSubscriptionRow(row);
}

export async function findPlanDurationDays(planId: PaidPlanId): Promise<number> {
  const pool = getPostgresPool();
  const result = await pool.query<{ duration_days: number }>(
    `SELECT duration_days FROM plans WHERE id = $1 LIMIT 1`,
    [planId]
  );

  const duration = result.rows[0]?.duration_days;
  if (!duration || duration <= 0) {
    throw new Error(`Plano ${planId} não encontrado no catálogo persistido.`);
  }

  return duration;
}
