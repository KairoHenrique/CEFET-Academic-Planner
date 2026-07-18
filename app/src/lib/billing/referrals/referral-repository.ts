import { getPostgresPool } from "@/lib/db/postgres/pool";

export type AccountReferralStatus = "pending" | "rewarded" | "void";

export interface AccountReferralRow {
  id: string;
  referred_user_id: string;
  referred_cpf: string;
  referrer_user_id: string;
  referrer_cpf: string;
  referrer_matricula: string;
  status: AccountReferralStatus;
  referrer_days_granted: number;
  referred_days_granted: number;
  created_at: string;
  rewarded_at: string | null;
}

interface AccountReferralDbRow {
  id: string;
  referred_user_id: string;
  referred_cpf: string;
  referrer_user_id: string;
  referrer_cpf: string;
  referrer_matricula: string;
  status: AccountReferralStatus;
  referrer_days_granted: number;
  referred_days_granted: number;
  created_at: Date;
  rewarded_at: Date | null;
}

function mapReferralRow(row: AccountReferralDbRow): AccountReferralRow {
  return {
    id: row.id,
    referred_user_id: row.referred_user_id,
    referred_cpf: row.referred_cpf,
    referrer_user_id: row.referrer_user_id,
    referrer_cpf: row.referrer_cpf,
    referrer_matricula: row.referrer_matricula,
    status: row.status,
    referrer_days_granted: row.referrer_days_granted,
    referred_days_granted: row.referred_days_granted,
    created_at: row.created_at.toISOString(),
    rewarded_at: row.rewarded_at ? row.rewarded_at.toISOString() : null,
  };
}

export interface ReferrerByMatricula {
  userId: string;
  cpf: string;
  matricula: string;
}

export async function findReferrerByMatricula(
  matricula: string
): Promise<ReferrerByMatricula | null> {
  const pool = getPostgresPool();
  const result = await pool.query<{
    user_id: string;
    cpf: string;
    matricula: string;
  }>(
    `SELECT a.user_id, p.cpf, a.matricula
     FROM aluno a
     INNER JOIN app_profiles p ON p.user_id = a.user_id
     WHERE a.matricula = $1
     LIMIT 1`,
    [matricula]
  );

  const row = result.rows[0];
  if (!row) {
    return null;
  }

  return {
    userId: row.user_id,
    cpf: row.cpf,
    matricula: row.matricula,
  };
}

export async function insertPendingReferral(input: {
  referredUserId: string;
  referredCpf: string;
  referrerUserId: string;
  referrerCpf: string;
  referrerMatricula: string;
}): Promise<AccountReferralRow> {
  const pool = getPostgresPool();
  const result = await pool.query<AccountReferralDbRow>(
    `INSERT INTO account_referrals (
       referred_user_id, referred_cpf,
       referrer_user_id, referrer_cpf, referrer_matricula,
       status
     ) VALUES ($1, $2, $3, $4, $5, 'pending')
     RETURNING id, referred_user_id, referred_cpf,
               referrer_user_id, referrer_cpf, referrer_matricula,
               status, referrer_days_granted, referred_days_granted,
               created_at, rewarded_at`,
    [
      input.referredUserId,
      input.referredCpf,
      input.referrerUserId,
      input.referrerCpf,
      input.referrerMatricula,
    ]
  );

  const row = result.rows[0];
  if (!row) {
    throw new Error("Falha ao registrar indicação.");
  }

  return mapReferralRow(row);
}

export async function findPendingReferralByReferredUserId(
  referredUserId: string
): Promise<AccountReferralRow | null> {
  const pool = getPostgresPool();
  const result = await pool.query<AccountReferralDbRow>(
    `SELECT id, referred_user_id, referred_cpf,
            referrer_user_id, referrer_cpf, referrer_matricula,
            status, referrer_days_granted, referred_days_granted,
            created_at, rewarded_at
     FROM account_referrals
     WHERE referred_user_id = $1
       AND status = 'pending'
     LIMIT 1`,
    [referredUserId]
  );

  const row = result.rows[0];
  return row ? mapReferralRow(row) : null;
}

/** Soma dias já concedidos ao usuário (como indicador e/ou indicado). */
export async function sumReferralBonusDaysForUser(
  userId: string
): Promise<number> {
  const pool = getPostgresPool();
  const result = await pool.query<{ total: string }>(
    `SELECT COALESCE(SUM(days), 0)::text AS total
     FROM (
       SELECT referrer_days_granted AS days
       FROM account_referrals
       WHERE referrer_user_id = $1 AND status = 'rewarded'
       UNION ALL
       SELECT referred_days_granted AS days
       FROM account_referrals
       WHERE referred_user_id = $1 AND status = 'rewarded'
     ) AS granted`,
    [userId]
  );

  return Number.parseInt(result.rows[0]?.total ?? "0", 10) || 0;
}

/**
 * Marca pending → rewarded de forma atômica.
 * Retorna a linha se venceu a corrida; null se já recompensada.
 */
export async function claimReferralForReward(input: {
  referralId: string;
  referrerDaysGranted: number;
  referredDaysGranted: number;
}): Promise<AccountReferralRow | null> {
  const pool = getPostgresPool();
  const result = await pool.query<AccountReferralDbRow>(
    `UPDATE account_referrals
     SET status = 'rewarded',
         referrer_days_granted = $2,
         referred_days_granted = $3,
         rewarded_at = now()
     WHERE id = $1
       AND status = 'pending'
     RETURNING id, referred_user_id, referred_cpf,
               referrer_user_id, referrer_cpf, referrer_matricula,
               status, referrer_days_granted, referred_days_granted,
               created_at, rewarded_at`,
    [input.referralId, input.referrerDaysGranted, input.referredDaysGranted]
  );

  const row = result.rows[0];
  return row ? mapReferralRow(row) : null;
}
