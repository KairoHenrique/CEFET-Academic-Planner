import { getPostgresPool } from "@/lib/db/postgres/pool";
import { internalError, unauthorizedError } from "@/lib/api/errors";

const MAX_POINTS = 5;
const WINDOW_MINUTES = 15;
const LOCKOUT_MINUTES = 15;

export async function consumeIpRateLimit(ip: string): Promise<void> {
  const pool = getPostgresPool();

  const query = `
    INSERT INTO auth_rate_limits (ip_address, points, last_request_at)
    VALUES ($1, 1, now())
    ON CONFLICT (ip_address)
    DO UPDATE SET
      points = CASE 
        WHEN auth_rate_limits.locked_until > now() THEN auth_rate_limits.points + 1
        WHEN auth_rate_limits.last_request_at < now() - interval '${WINDOW_MINUTES} minutes' THEN 1
        ELSE auth_rate_limits.points + 1
      END,
      last_request_at = now(),
      locked_until = CASE 
        WHEN auth_rate_limits.locked_until > now() THEN auth_rate_limits.locked_until
        WHEN (
          CASE 
            WHEN auth_rate_limits.last_request_at < now() - interval '${WINDOW_MINUTES} minutes' THEN 0
            ELSE auth_rate_limits.points
          END
        ) >= ${MAX_POINTS - 1} THEN now() + interval '${LOCKOUT_MINUTES} minutes'
        ELSE NULL
      END
    RETURNING points, locked_until;
  `;

  const result = await pool.query(query, [ip]);
  const row = result.rows[0];

  if (row && row.locked_until && new Date(row.locked_until) > new Date()) {
    throw unauthorizedError("Muitas tentativas. Tente novamente mais tarde.");
  }
}

export async function checkAccountLockout(cpf: string): Promise<void> {
  const pool = getPostgresPool();
  const result = await pool.query(
    "SELECT locked_until FROM auth_account_lockout WHERE cpf = $1 LIMIT 1",
    [cpf]
  );
  const row = result.rows[0];
  if (row && row.locked_until && new Date(row.locked_until) > new Date()) {
    throw unauthorizedError("Conta temporariamente bloqueada por motivos de segurança.");
  }
}

export async function recordFailedLogin(cpf: string): Promise<void> {
  const pool = getPostgresPool();
  await pool.query(
    `INSERT INTO auth_account_lockout (cpf, failed_attempts)
     VALUES ($1, 1)
     ON CONFLICT (cpf)
     DO UPDATE SET 
       failed_attempts = auth_account_lockout.failed_attempts + 1,
       locked_until = CASE 
         WHEN auth_account_lockout.failed_attempts + 1 >= 5 THEN now() + interval '${LOCKOUT_MINUTES} minutes'
         ELSE NULL
       END`,
    [cpf]
  );
}

export async function resetFailedLogin(cpf: string): Promise<void> {
  const pool = getPostgresPool();
  await pool.query(
    "DELETE FROM auth_account_lockout WHERE cpf = $1",
    [cpf]
  );
}
