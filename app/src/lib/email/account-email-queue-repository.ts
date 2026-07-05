import { getPostgresPool } from "@/lib/db/postgres/pool";
import type {
  AccountEmailEnqueueInput,
  AccountEmailQueueRow,
} from "@/lib/email/account-email-types";

interface QueueRowRecord {
  id: string;
  user_id: string | null;
  cpf: string;
  to_email: string;
  kind: AccountEmailQueueRow["kind"];
  dedupe_key: string;
  subject: string;
  body_text: string;
  status: AccountEmailQueueRow["status"];
  scheduled_for: Date;
  attempts: number;
  last_error: string | null;
  sent_at: Date | null;
  created_at: Date;
}

function mapQueueRow(row: QueueRowRecord): AccountEmailQueueRow {
  return {
    id: row.id,
    userId: row.user_id,
    cpf: row.cpf,
    toEmail: row.to_email,
    kind: row.kind,
    dedupeKey: row.dedupe_key,
    subject: row.subject,
    bodyText: row.body_text,
    status: row.status,
    scheduledFor: row.scheduled_for.toISOString(),
    attempts: row.attempts,
    lastError: row.last_error,
    sentAt: row.sent_at?.toISOString() ?? null,
    createdAt: row.created_at.toISOString(),
  };
}

export async function enqueueAccountEmail(
  input: AccountEmailEnqueueInput
): Promise<"queued" | "duplicate"> {
  const pool = getPostgresPool();
  const result = await pool.query(
    `INSERT INTO account_email_queue (
       user_id, cpf, to_email, kind, dedupe_key, subject, body_text, scheduled_for
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, COALESCE($8, now()))
     ON CONFLICT (kind, dedupe_key) DO NOTHING`,
    [
      input.userId ?? null,
      input.cpf,
      input.toEmail,
      input.kind,
      input.dedupeKey,
      input.subject,
      input.bodyText,
      input.scheduledFor ?? null,
    ]
  );

  return (result.rowCount ?? 0) > 0 ? "queued" : "duplicate";
}

export async function claimPendingAccountEmails(
  limit = 20
): Promise<AccountEmailQueueRow[]> {
  const pool = getPostgresPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const result = await client.query<QueueRowRecord>(
      `SELECT id, user_id, cpf, to_email, kind, dedupe_key, subject, body_text,
              status, scheduled_for, attempts, last_error, sent_at, created_at
       FROM account_email_queue
       WHERE status = 'pending'
         AND scheduled_for <= now()
       ORDER BY scheduled_for ASC, created_at ASC
       LIMIT $1
       FOR UPDATE SKIP LOCKED`,
      [limit]
    );

    const ids = result.rows.map((row) => row.id);
    if (ids.length === 0) {
      await client.query("COMMIT");
      return [];
    }

    await client.query(
      `UPDATE account_email_queue
       SET status = 'processing', attempts = attempts + 1
       WHERE id = ANY($1::uuid[])`,
      [ids]
    );

    await client.query("COMMIT");

    return result.rows.map((row) =>
      mapQueueRow({ ...row, status: "processing", attempts: row.attempts + 1 })
    );
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function markAccountEmailSent(id: string): Promise<void> {
  const pool = getPostgresPool();
  await pool.query(
    `UPDATE account_email_queue
     SET status = 'sent', sent_at = now(), last_error = NULL
     WHERE id = $1`,
    [id]
  );
}

export async function markAccountEmailFailed(
  id: string,
  errorMessage: string
): Promise<void> {
  const pool = getPostgresPool();
  await pool.query(
    `UPDATE account_email_queue
     SET status = 'failed', last_error = $2
     WHERE id = $1`,
    [id, errorMessage.slice(0, 500)]
  );
}
