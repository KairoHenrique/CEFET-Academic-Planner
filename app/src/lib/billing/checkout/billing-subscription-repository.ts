import { getPostgresPool } from "@/lib/db/postgres/pool";
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
