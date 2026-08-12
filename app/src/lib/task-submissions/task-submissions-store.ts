import { randomUUID } from "node:crypto";
import { getPostgresPool } from "@/lib/db/postgres/pool";

export type TaskSubmissionStatus = "queued" | "running" | "completed" | "failed";

export interface TaskSubmissionRecord {
  id: string;
  userId: string;
  cursoId: string;
  tarefaId: number;
  sigaaLinkId: string;
  fileName: string;
  fileMime: string | null;
  fileSize: number;
  fileBytes: Buffer;
  commentText: string | null;
  status: TaskSubmissionStatus;
  errorMessage: string | null;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
}

const MAX_FILE_BYTES = 10 * 1024 * 1024;

function mapRow(row: Record<string, unknown>): TaskSubmissionRecord {
  const bytes = row.file_bytes;
  return {
    id: String(row.id),
    userId: String(row.user_id),
    cursoId: String(row.curso_id),
    tarefaId: Number(row.tarefa_id),
    sigaaLinkId: String(row.sigaa_link_id),
    fileName: String(row.file_name),
    fileMime: row.file_mime != null ? String(row.file_mime) : null,
    fileSize: Number(row.file_size),
    fileBytes: Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes as Uint8Array),
    commentText: row.comment_text != null ? String(row.comment_text) : null,
    status: row.status as TaskSubmissionStatus,
    errorMessage: row.error_message != null ? String(row.error_message) : null,
    createdAt: String(row.created_at),
    startedAt: row.started_at != null ? String(row.started_at) : null,
    finishedAt: row.finished_at != null ? String(row.finished_at) : null,
  };
}

export function assertSubmissionFileSize(size: number): void {
  if (!Number.isFinite(size) || size <= 0) {
    throw new Error("Arquivo vazio.");
  }
  if (size > MAX_FILE_BYTES) {
    throw new Error("Arquivo excede o limite de 10 MB do SIGAA.");
  }
}

export async function pgCreateTaskSubmission(input: {
  userId: string;
  cursoId: string;
  tarefaId: number;
  sigaaLinkId: string;
  fileName: string;
  fileMime: string | null;
  fileBytes: Buffer;
  commentText: string | null;
}): Promise<TaskSubmissionRecord> {
  assertSubmissionFileSize(input.fileBytes.length);
  const id = randomUUID();
  const pool = getPostgresPool();
  const result = await pool.query(
    `INSERT INTO task_submissions (
       id, user_id, curso_id, tarefa_id, sigaa_link_id,
       file_name, file_mime, file_size, file_bytes, comment_text, status
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'queued')
     RETURNING *`,
    [
      id,
      input.userId,
      input.cursoId,
      input.tarefaId,
      input.sigaaLinkId,
      input.fileName,
      input.fileMime,
      input.fileBytes.length,
      input.fileBytes,
      input.commentText,
    ]
  );
  return mapRow(result.rows[0] as Record<string, unknown>);
}

export async function pgGetTaskSubmission(
  id: string
): Promise<TaskSubmissionRecord | null> {
  const pool = getPostgresPool();
  const result = await pool.query(`SELECT * FROM task_submissions WHERE id = $1`, [
    id,
  ]);
  const row = result.rows[0] as Record<string, unknown> | undefined;
  return row ? mapRow(row) : null;
}

export async function pgMarkTaskSubmissionRunning(id: string): Promise<void> {
  const pool = getPostgresPool();
  await pool.query(
    `UPDATE task_submissions
     SET status = 'running', started_at = COALESCE(started_at, now())
     WHERE id = $1 AND status IN ('queued', 'running')`,
    [id]
  );
}

export async function pgMarkTaskSubmissionCompleted(id: string): Promise<void> {
  const pool = getPostgresPool();
  await pool.query(
    `UPDATE task_submissions
     SET status = 'completed', finished_at = now(), error_message = NULL
     WHERE id = $1`,
    [id]
  );
}

export async function pgMarkTaskSubmissionFailed(
  id: string,
  message: string
): Promise<void> {
  const pool = getPostgresPool();
  await pool.query(
    `UPDATE task_submissions
     SET status = 'failed', finished_at = now(), error_message = $2
     WHERE id = $1`,
    [id, message.slice(0, 2000)]
  );
}

export { MAX_FILE_BYTES as TASK_SUBMISSION_MAX_BYTES };
