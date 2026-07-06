import { getPostgresPool } from "@/lib/db/postgres/pool";
import type { GiftKeyStatus } from "./gift-key-schema";
import type { PaidPlanId } from "@/lib/billing/types";

export interface GiftKeyRow {
  code: string;
  plan_id: PaidPlanId;
  duration_days: number;
  status: GiftKeyStatus;
  key_expires_at: string | null;
  redeemed_by_cpf: string | null;
  redeemed_at: string | null;
  created_by: string;
  internal_label: string | null;
  created_at: string;
  updated_at: string;
}

interface GiftKeyDbRow {
  code: string;
  plan_id: PaidPlanId;
  duration_days: number;
  status: GiftKeyStatus;
  key_expires_at: Date | null;
  redeemed_by_cpf: string | null;
  redeemed_at: Date | null;
  created_by: string;
  internal_label: string | null;
  created_at: Date;
  updated_at: Date;
}

function mapGiftKeyRow(row: GiftKeyDbRow): GiftKeyRow {
  return {
    code: row.code,
    plan_id: row.plan_id,
    duration_days: row.duration_days,
    status: row.status,
    key_expires_at: row.key_expires_at?.toISOString() ?? null,
    redeemed_by_cpf: row.redeemed_by_cpf,
    redeemed_at: row.redeemed_at?.toISOString() ?? null,
    created_by: row.created_by,
    internal_label: row.internal_label,
    created_at: row.created_at.toISOString(),
    updated_at: row.updated_at.toISOString(),
  };
}

const GIFT_KEY_SELECT = `
  SELECT code, plan_id, duration_days, status, key_expires_at,
         redeemed_by_cpf, redeemed_at, created_by, internal_label,
         created_at, updated_at
  FROM plan_gift_keys
`;

export async function insertGiftKeys(input: {
  codes: string[];
  planId: PaidPlanId;
  durationDays: number;
  createdBy: string;
  internalLabel?: string | null;
  keyExpiresAt?: string | null;
}): Promise<GiftKeyRow[]> {
  const pool = getPostgresPool();
  const rows: GiftKeyRow[] = [];

  for (const code of input.codes) {
    const result = await pool.query<GiftKeyDbRow>(
      `INSERT INTO plan_gift_keys (
         code, plan_id, duration_days, status, key_expires_at,
         created_by, internal_label
       ) VALUES ($1, $2, $3, 'available', $4, $5, $6)
       RETURNING code, plan_id, duration_days, status, key_expires_at,
                 redeemed_by_cpf, redeemed_at, created_by, internal_label,
                 created_at, updated_at`,
      [
        code,
        input.planId,
        input.durationDays,
        input.keyExpiresAt ?? null,
        input.createdBy,
        input.internalLabel ?? null,
      ]
    );

    const row = result.rows[0];
    if (row) {
      rows.push(mapGiftKeyRow(row));
    }
  }

  return rows;
}

export async function listGiftKeys(limit = 100): Promise<GiftKeyRow[]> {
  const pool = getPostgresPool();
  const capped = Math.min(Math.max(limit, 1), 500);
  const result = await pool.query<GiftKeyDbRow>(
    `${GIFT_KEY_SELECT}
     ORDER BY created_at DESC
     LIMIT $1`,
    [capped]
  );

  return result.rows.map(mapGiftKeyRow);
}

export async function findGiftKeyByCode(code: string): Promise<GiftKeyRow | null> {
  const pool = getPostgresPool();
  const result = await pool.query<GiftKeyDbRow>(
    `${GIFT_KEY_SELECT}
     WHERE code = $1
     LIMIT 1`,
    [code]
  );

  const row = result.rows[0];
  return row ? mapGiftKeyRow(row) : null;
}

export async function redeemGiftKeyAtomic(input: {
  code: string;
  cpf: string;
}): Promise<GiftKeyRow | null> {
  const pool = getPostgresPool();
  const result = await pool.query<GiftKeyDbRow>(
    `UPDATE plan_gift_keys
     SET status = 'redeemed',
         redeemed_by_cpf = $2,
         redeemed_at = now(),
         updated_at = now()
     WHERE code = $1
       AND status = 'available'
       AND (key_expires_at IS NULL OR key_expires_at > now())
     RETURNING code, plan_id, duration_days, status, key_expires_at,
               redeemed_by_cpf, redeemed_at, created_by, internal_label,
               created_at, updated_at`,
    [input.code, input.cpf]
  );

  const row = result.rows[0];
  return row ? mapGiftKeyRow(row) : null;
}

export async function revokeGiftKey(code: string): Promise<GiftKeyRow | null> {
  const pool = getPostgresPool();
  const result = await pool.query<GiftKeyDbRow>(
    `UPDATE plan_gift_keys
     SET status = 'revoked', updated_at = now()
     WHERE code = $1
       AND status = 'available'
     RETURNING code, plan_id, duration_days, status, key_expires_at,
               redeemed_by_cpf, redeemed_at, created_by, internal_label,
               created_at, updated_at`,
    [code]
  );

  const row = result.rows[0];
  return row ? mapGiftKeyRow(row) : null;
}

export async function markExpiredGiftKeys(now = new Date()): Promise<number> {
  const pool = getPostgresPool();
  const result = await pool.query(
    `UPDATE plan_gift_keys
     SET status = 'expired', updated_at = now()
     WHERE status = 'available'
       AND key_expires_at IS NOT NULL
       AND key_expires_at <= $1`,
    [now.toISOString()]
  );

  return result.rowCount ?? 0;
}
