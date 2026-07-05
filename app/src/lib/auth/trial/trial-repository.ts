import { getPostgresPool } from "@/lib/db/postgres/pool";

interface TrialRow {
  trial_started_at: Date;
}

export async function findTrialStartedAtByCpf(
  cpf: string
): Promise<Date | null> {
  const pool = getPostgresPool();
  const result = await pool.query<TrialRow>(
    `SELECT trial_started_at
     FROM trial_por_cpf
     WHERE cpf = $1
     LIMIT 1`,
    [cpf]
  );

  return result.rows[0]?.trial_started_at ?? null;
}

export async function claimTrialForCpf(cpf: string): Promise<Date> {
  const pool = getPostgresPool();
  const inserted = await pool.query<TrialRow>(
    `INSERT INTO trial_por_cpf (cpf, trial_started_at)
     VALUES ($1, now())
     ON CONFLICT (cpf) DO NOTHING
     RETURNING trial_started_at`,
    [cpf]
  );

  const insertedAt = inserted.rows[0]?.trial_started_at;
  if (insertedAt) {
    return insertedAt;
  }

  const existing = await findTrialStartedAtByCpf(cpf);
  if (!existing) {
    throw new Error("Falha ao registrar trial por CPF.");
  }

  return existing;
}
