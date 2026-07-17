import { validationError } from "@/lib/api/errors";

export interface WorkerEmailSendRequest {
  toEmail: string;
  subject: string;
  bodyText: string;
  bodyHtml?: string;
}

const SUBJECT_MAX = 200;
const BODY_MAX = 50_000;

export function parseWorkerEmailSendRequest(body: unknown): WorkerEmailSendRequest {
  if (!body || typeof body !== "object") {
    throw validationError("Corpo da requisição inválido.");
  }

  const record = body as Record<string, unknown>;
  const toEmail =
    typeof record.toEmail === "string" ? record.toEmail.trim() : "";
  const subject =
    typeof record.subject === "string" ? record.subject.trim() : "";
  const bodyText =
    typeof record.bodyText === "string" ? record.bodyText : "";
  const bodyHtml =
    typeof record.bodyHtml === "string" ? record.bodyHtml : undefined;

  if (!toEmail || !toEmail.includes("@")) {
    throw validationError("toEmail inválido.");
  }
  if (!subject || subject.length > SUBJECT_MAX) {
    throw validationError(`subject deve ter 1–${SUBJECT_MAX} caracteres.`);
  }
  if (!bodyText || bodyText.length > BODY_MAX) {
    throw validationError(`bodyText deve ter 1–${BODY_MAX} caracteres.`);
  }
  if (bodyHtml && bodyHtml.length > BODY_MAX * 2) {
    throw validationError("bodyHtml muito grande.");
  }

  return { toEmail, subject, bodyText, bodyHtml };
}
