import { getPostgresPool } from "@/lib/db/postgres/pool";

export type RevokeAllActiveSubscriptionsResult = {
  revoked: number;
};

/**
 * Zera tempo de plano (ads_free) de todos os usuarios.
 * Marca active/trial_active como expired e empurra expires_at
 * para fora do grace period.
 */
export async function revokeAllActiveSubscriptions(): Promise<RevokeAllActiveSubscriptionsResult> {
  const pool = getPostgresPool();
  const result = await pool.query(
    `UPDATE subscriptions
     SET status = 'expired',
         expires_at = now() - interval '90 days',
         updated_at = now()
     WHERE status IN ('active', 'trial_active')
     RETURNING id`
  );

  return { revoked: result.rowCount ?? 0 };
}
