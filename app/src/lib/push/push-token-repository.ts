import type pg from "pg";

export interface PushDeviceTokenRow {
  expo_push_token: string;
  cpf: string;
  user_id: string;
}

export async function upsertPushDeviceToken(
  pool: pg.Pool,
  input: {
    userId: string;
    cpf: string;
    expoPushToken: string;
    platform?: string;
  }
): Promise<void> {
  await pool.query(
    `INSERT INTO push_device_tokens (user_id, cpf, expo_push_token, platform)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (expo_push_token) DO UPDATE
       SET user_id = EXCLUDED.user_id,
           cpf = EXCLUDED.cpf,
           platform = EXCLUDED.platform,
           updated_at = now()`,
    [
      input.userId,
      input.cpf,
      input.expoPushToken,
      input.platform ?? "android",
    ]
  );
}

export async function deletePushDeviceToken(
  pool: pg.Pool,
  input: { userId: string; expoPushToken: string }
): Promise<void> {
  await pool.query(
    `DELETE FROM push_device_tokens
     WHERE user_id = $1 AND expo_push_token = $2`,
    [input.userId, input.expoPushToken]
  );
}

export async function listPushTokensByCpf(
  pool: pg.Pool,
  cpf: string
): Promise<string[]> {
  const result = await pool.query<{ expo_push_token: string }>(
    `SELECT expo_push_token FROM push_device_tokens WHERE cpf = $1`,
    [cpf]
  );
  return result.rows.map((row) => row.expo_push_token);
}

/** Tokens distintos para broadcast (ex.: nova versão do APK). Sem PII. */
export async function listAllDistinctPushTokens(
  pool: pg.Pool
): Promise<string[]> {
  const result = await pool.query<{ expo_push_token: string }>(
    `SELECT DISTINCT expo_push_token
     FROM push_device_tokens
     WHERE expo_push_token LIKE 'ExponentPushToken%'`
  );
  return result.rows.map((row) => row.expo_push_token);
}
