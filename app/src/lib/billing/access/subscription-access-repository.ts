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

const SUBSCRIPTION_BY_CPF = `
  SELECT s.id, s.user_id, s.plan_id, s.status, s.source, s.started_at,
         s.expires_at, s.created_at, s.updated_at
  FROM subscriptions s
  INNER JOIN app_profiles p ON p.user_id = s.user_id
  WHERE p.cpf = $1
`;

export async function findActiveSubscriptionByCpf(
  cpf: string,
  now = new Date()
): Promise<SubscriptionRow | null> {
  const pool = getPostgresPool();
  const result = await pool.query<SubscriptionDbRow>(
    `${SUBSCRIPTION_BY_CPF}
     AND s.status = 'active'
     AND s.expires_at > $2
     ORDER BY s.expires_at DESC
     LIMIT 1`,
    [cpf, now.toISOString()]
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
  const pool = getPostgresPool();
  const result = await pool.query<SubscriptionDbRow>(
    `${SUBSCRIPTION_BY_CPF}
     AND (
       s.status IN ('expired', 'cancelled')
       OR (s.status = 'active' AND s.expires_at <= $2)
     )
     ORDER BY s.expires_at DESC
     LIMIT 1`,
    [cpf, now.toISOString()]
  );

  const row = result.rows[0];
  return row ? mapSubscriptionRow(row) : null;
}
