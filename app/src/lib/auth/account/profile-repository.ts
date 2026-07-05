import { getPostgresPool } from "@/lib/db/postgres/pool";
import type { AppCursoId, AppProfileRecord } from "@/lib/auth/account/types";

interface ProfileRow {
  user_id: string;
  cpf: string;
  email: string;
  telefone: string;
  curso_id: AppCursoId;
  created_at: Date;
}

function mapProfileRow(row: ProfileRow): AppProfileRecord {
  return {
    userId: row.user_id,
    cpf: row.cpf,
    email: row.email,
    telefone: row.telefone,
    cursoId: row.curso_id,
    createdAt: row.created_at.toISOString(),
  };
}

export async function findProfileByEmail(
  email: string
): Promise<AppProfileRecord | null> {
  const pool = getPostgresPool();
  const result = await pool.query<ProfileRow>(
    `SELECT user_id, cpf, email, telefone, curso_id, created_at
     FROM app_profiles
     WHERE lower(email) = lower($1)
     LIMIT 1`,
    [email]
  );

  const row = result.rows[0];
  return row ? mapProfileRow(row) : null;
}

export async function findEncryptedPasswordByCpf(
  cpf: string
): Promise<string | null> {
  const pool = getPostgresPool();
  const result = await pool.query<{ sigaa_password_enc: string }>(
    `SELECT sigaa_password_enc
     FROM app_profiles
     WHERE cpf = $1
     LIMIT 1`,
    [cpf]
  );

  return result.rows[0]?.sigaa_password_enc ?? null;
}

export async function updateSigaaPasswordEnc(
  cpf: string,
  sigaaPasswordEnc: string
): Promise<void> {
  const pool = getPostgresPool();
  const result = await pool.query(
    `UPDATE app_profiles
     SET sigaa_password_enc = $2, updated_at = now()
     WHERE cpf = $1`,
    [cpf, sigaaPasswordEnc]
  );

  if ((result.rowCount ?? 0) === 0) {
    throw new Error("Perfil não encontrado para atualizar credencial SIGAA.");
  }
}

export async function findProfileByCpf(
  cpf: string
): Promise<AppProfileRecord | null> {
  const pool = getPostgresPool();
  const result = await pool.query<ProfileRow>(
    `SELECT user_id, cpf, email, telefone, curso_id, created_at
     FROM app_profiles
     WHERE cpf = $1
     LIMIT 1`,
    [cpf]
  );

  const row = result.rows[0];
  return row ? mapProfileRow(row) : null;
}

export async function findProfileByUserId(
  userId: string
): Promise<AppProfileRecord | null> {
  const pool = getPostgresPool();
  const result = await pool.query<ProfileRow>(
    `SELECT user_id, cpf, email, telefone, curso_id, created_at
     FROM app_profiles
     WHERE user_id = $1
     LIMIT 1`,
    [userId]
  );

  const row = result.rows[0];
  return row ? mapProfileRow(row) : null;
}

export async function insertAppProfile(input: {
  userId: string;
  cpf: string;
  email: string;
  telefone: string;
  cursoId: AppCursoId;
  sigaaPasswordEnc: string;
}): Promise<AppProfileRecord> {
  const pool = getPostgresPool();
  const result = await pool.query<ProfileRow>(
    `INSERT INTO app_profiles (
       user_id, cpf, email, telefone, curso_id, sigaa_password_enc
     ) VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING user_id, cpf, email, telefone, curso_id, created_at`,
    [
      input.userId,
      input.cpf,
      input.email,
      input.telefone,
      input.cursoId,
      input.sigaaPasswordEnc,
    ]
  );

  const row = result.rows[0];
  if (!row) {
    throw new Error("Falha ao persistir perfil do aluno.");
  }

  return mapProfileRow(row);
}

export async function deleteProfileByUserId(userId: string): Promise<void> {
  const pool = getPostgresPool();
  await pool.query("DELETE FROM app_profiles WHERE user_id = $1", [userId]);
}
