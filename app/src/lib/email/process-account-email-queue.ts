import type { AccountEmailQueueRow } from "@/lib/email/account-email-types";
import {
  markAccountEmailFailed,
  markAccountEmailSent,
  rescheduleAccountEmailForRetry,
} from "@/lib/email/account-email-queue-repository";

export interface AccountEmailSendResult {
  ok: boolean;
  error?: string;
  /** false = falha permanente (não re-tentar). Ausente/true = transitório. */
  retryable?: boolean;
}

export type AccountEmailSender = (
  message: AccountEmailQueueRow
) => Promise<AccountEmailSendResult>;

export interface AccountEmailDeliveryResult {
  processed: number;
  sent: number;
  failed: number;
  retried: number;
}

/** Nº máximo de tentativas antes de marcar como falha definitiva. */
const MAX_ATTEMPTS = 4;
/** Backoff exponencial (segundos): 60 → 120 → 240. */
const RETRY_BASE_DELAY_SECONDS = 60;

/** Stub de log (dev/local sem Resend configurado). Nunca envia de fato. */
export async function defaultAccountEmailSender(
  message: AccountEmailQueueRow
): Promise<AccountEmailSendResult> {
  if (!message.toEmail.includes("@")) {
    return { ok: false, error: "Destinatário inválido.", retryable: false };
  }

  console.info("[account-email] queued-send (stub — Resend não configurado)", {
    id: message.id,
    kind: message.kind,
    cpfSuffix: message.cpf.slice(-4),
    subject: message.subject,
  });

  return { ok: true };
}

function resolveRetryDelaySeconds(attempts: number): number {
  const exponent = Math.max(0, attempts - 1);
  return RETRY_BASE_DELAY_SECONDS * 2 ** exponent;
}

/**
 * Decide entre re-agendar (transitório, dentro do limite) ou falhar de vez.
 * Retorna "retried" | "failed" para contabilização.
 */
async function handleSendFailure(
  message: AccountEmailQueueRow,
  errorMessage: string,
  retryable: boolean
): Promise<"retried" | "failed"> {
  if (retryable && message.attempts < MAX_ATTEMPTS) {
    await rescheduleAccountEmailForRetry(
      message.id,
      resolveRetryDelaySeconds(message.attempts),
      errorMessage
    );
    return "retried";
  }

  await markAccountEmailFailed(message.id, errorMessage);
  return "failed";
}

export async function processAccountEmailQueue(
  sender: AccountEmailSender = defaultAccountEmailSender,
  batchSize = 20
): Promise<AccountEmailDeliveryResult> {
  const { claimPendingAccountEmails } = await import(
    "@/lib/email/account-email-queue-repository"
  );
  const messages = await claimPendingAccountEmails(batchSize);

  let sent = 0;
  let failed = 0;
  let retried = 0;

  for (const message of messages) {
    try {
      const result = await sender(message);
      if (result.ok) {
        await markAccountEmailSent(message.id);
        sent += 1;
        continue;
      }

      const outcome = await handleSendFailure(
        message,
        result.error ?? "Falha ao enviar e-mail.",
        result.retryable !== false
      );
      if (outcome === "retried") retried += 1;
      else failed += 1;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Falha ao enviar e-mail.";
      const outcome = await handleSendFailure(message, errorMessage, true);
      if (outcome === "retried") retried += 1;
      else failed += 1;
    }
  }

  return { processed: messages.length, sent, failed, retried };
}
