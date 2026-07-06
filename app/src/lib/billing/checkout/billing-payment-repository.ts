import { getPostgresPool } from "@/lib/db/postgres/pool";
import type { PaymentGateway, PaymentStatus } from "@/lib/billing/schema/billing-schema-catalog";
import type { PaymentRow } from "@/lib/billing/schema/billing-row-types";
import type { PaidPlanId } from "@/lib/billing/types";

interface PaymentDbRow {
  id: string;
  user_id: string;
  subscription_id: string | null;
  plan_id: PaidPlanId;
  amount_cents: number;
  currency: "BRL";
  status: PaymentStatus;
  gateway: PaymentGateway;
  gateway_payment_id: string | null;
  external_reference: string;
  idempotency_key: string;
  payer_cpf: string | null;
  qr_code: string | null;
  expires_at: Date | null;
  paid_at: Date | null;
  metadata: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

function mapPaymentRow(row: PaymentDbRow): PaymentRow {
  return {
    id: row.id,
    user_id: row.user_id,
    subscription_id: row.subscription_id,
    plan_id: row.plan_id,
    amount_cents: row.amount_cents,
    currency: row.currency,
    status: row.status,
    gateway: row.gateway,
    gateway_payment_id: row.gateway_payment_id,
    external_reference: row.external_reference,
    idempotency_key: row.idempotency_key,
    payer_cpf: row.payer_cpf,
    qr_code: row.qr_code,
    expires_at: row.expires_at?.toISOString() ?? null,
    paid_at: row.paid_at?.toISOString() ?? null,
    metadata: row.metadata ?? {},
    created_at: row.created_at.toISOString(),
    updated_at: row.updated_at.toISOString(),
  };
}

const PAYMENT_SELECT = `
  SELECT id, user_id, subscription_id, plan_id, amount_cents, currency,
         status, gateway, gateway_payment_id, external_reference,
         idempotency_key, payer_cpf, qr_code, expires_at, paid_at,
         metadata, created_at, updated_at
  FROM payments
`;

export async function findPaymentByIdempotencyKey(
  userId: string,
  idempotencyKey: string
): Promise<PaymentRow | null> {
  const pool = getPostgresPool();
  const result = await pool.query<PaymentDbRow>(
    `${PAYMENT_SELECT}
     WHERE user_id = $1 AND idempotency_key = $2
     LIMIT 1`,
    [userId, idempotencyKey]
  );

  const row = result.rows[0];
  return row ? mapPaymentRow(row) : null;
}

export async function findPaymentById(
  paymentId: string
): Promise<PaymentRow | null> {
  const pool = getPostgresPool();
  const result = await pool.query<PaymentDbRow>(
    `${PAYMENT_SELECT}
     WHERE id = $1
     LIMIT 1`,
    [paymentId]
  );

  const row = result.rows[0];
  return row ? mapPaymentRow(row) : null;
}

export async function insertPendingPayment(input: {
  id: string;
  userId: string;
  subscriptionId: string;
  planId: PaidPlanId;
  amountCents: number;
  gateway: PaymentGateway;
  externalReference: string;
  idempotencyKey: string;
  payerCpf: string;
}): Promise<PaymentRow> {
  const pool = getPostgresPool();
  const result = await pool.query<PaymentDbRow>(
    `INSERT INTO payments (
       id, user_id, subscription_id, plan_id, amount_cents,
       status, gateway, external_reference, idempotency_key, payer_cpf
     ) VALUES ($1, $2, $3, $4, $5, 'pending', $6, $7, $8, $9)
     RETURNING id, user_id, subscription_id, plan_id, amount_cents, currency,
               status, gateway, gateway_payment_id, external_reference,
               idempotency_key, payer_cpf, qr_code, expires_at, paid_at,
               metadata, created_at, updated_at`,
    [
      input.id,
      input.userId,
      input.subscriptionId,
      input.planId,
      input.amountCents,
      input.gateway,
      input.externalReference,
      input.idempotencyKey,
      input.payerCpf,
    ]
  );

  const row = result.rows[0];
  if (!row) {
    throw new Error("Falha ao criar pagamento PIX.");
  }

  return mapPaymentRow(row);
}

export async function updatePaymentAfterPixCharge(input: {
  paymentId: string;
  gatewayPaymentId: string;
  qrCode: string;
  expiresAt: string;
  metadata?: Record<string, unknown>;
}): Promise<PaymentRow> {
  const pool = getPostgresPool();
  const result = await pool.query<PaymentDbRow>(
    `UPDATE payments
     SET gateway_payment_id = $2,
         qr_code = $3,
         expires_at = $4,
         metadata = COALESCE(metadata, '{}'::jsonb) || $5::jsonb,
         updated_at = now()
     WHERE id = $1
     RETURNING id, user_id, subscription_id, plan_id, amount_cents, currency,
               status, gateway, gateway_payment_id, external_reference,
               idempotency_key, payer_cpf, qr_code, expires_at, paid_at,
               metadata, created_at, updated_at`,
    [
      input.paymentId,
      input.gatewayPaymentId,
      input.qrCode,
      input.expiresAt,
      JSON.stringify(input.metadata ?? {}),
    ]
  );

  const row = result.rows[0];
  if (!row) {
    throw new Error("Pagamento não encontrado para atualização PIX.");
  }

  return mapPaymentRow(row);
}

export async function findPaymentByExternalReference(
  externalReference: string
): Promise<PaymentRow | null> {
  const pool = getPostgresPool();
  const result = await pool.query<PaymentDbRow>(
    `${PAYMENT_SELECT}
     WHERE external_reference = $1
     LIMIT 1`,
    [externalReference]
  );

  const row = result.rows[0];
  return row ? mapPaymentRow(row) : null;
}

export async function findPaymentByGatewayPaymentId(
  gateway: PaymentGateway,
  gatewayPaymentId: string
): Promise<PaymentRow | null> {
  const pool = getPostgresPool();
  const result = await pool.query<PaymentDbRow>(
    `${PAYMENT_SELECT}
     WHERE gateway = $1 AND gateway_payment_id = $2
     LIMIT 1`,
    [gateway, gatewayPaymentId]
  );

  const row = result.rows[0];
  return row ? mapPaymentRow(row) : null;
}

export async function updatePaymentStatus(input: {
  paymentId: string;
  status: PaymentStatus;
  paidAt?: string | null;
}): Promise<PaymentRow> {
  const pool = getPostgresPool();
  const result = await pool.query<PaymentDbRow>(
    `UPDATE payments
     SET status = $2,
         paid_at = COALESCE($3::timestamptz, paid_at),
         updated_at = now()
     WHERE id = $1
     RETURNING id, user_id, subscription_id, plan_id, amount_cents, currency,
               status, gateway, gateway_payment_id, external_reference,
               idempotency_key, payer_cpf, qr_code, expires_at, paid_at,
               metadata, created_at, updated_at`,
    [input.paymentId, input.status, input.paidAt ?? null]
  );

  const row = result.rows[0];
  if (!row) {
    throw new Error("Pagamento não encontrado para atualização de status.");
  }

  return mapPaymentRow(row);
}

export async function markPaymentRejected(paymentId: string): Promise<void> {
  const pool = getPostgresPool();
  await pool.query(
    `UPDATE payments
     SET status = 'rejected', updated_at = now()
     WHERE id = $1`,
    [paymentId]
  );
}

export async function findPaymentByIdForUser(
  paymentId: string,
  userId: string
): Promise<PaymentRow | null> {
  const pool = getPostgresPool();
  const result = await pool.query<PaymentDbRow>(
    `${PAYMENT_SELECT}
     WHERE id = $1 AND user_id = $2
     LIMIT 1`,
    [paymentId, userId]
  );

  const row = result.rows[0];
  return row ? mapPaymentRow(row) : null;
}

export async function listPaymentsForUser(
  userId: string,
  limit = 20
): Promise<PaymentRow[]> {
  const pool = getPostgresPool();
  const result = await pool.query<PaymentDbRow>(
    `${PAYMENT_SELECT}
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [userId, limit]
  );

  return result.rows.map(mapPaymentRow);
}
