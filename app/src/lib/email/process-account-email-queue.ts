import type { AccountEmailQueueRow } from "@/lib/email/account-email-types";
import {
  markAccountEmailFailed,
  markAccountEmailSent,
} from "@/lib/email/account-email-queue-repository";

export interface AccountEmailSendResult {
  ok: boolean;
  error?: string;
}

export type AccountEmailSender = (
  message: AccountEmailQueueRow
) => Promise<AccountEmailSendResult>;

async function defaultAccountEmailSender(
  message: AccountEmailQueueRow
): Promise<AccountEmailSendResult> {
  if (!message.toEmail.includes("@")) {
    return { ok: false, error: "Destinatário inválido." };
  }

  console.info("[account-email] queued-send", {
    id: message.id,
    kind: message.kind,
    cpfSuffix: message.cpf.slice(-4),
    subject: message.subject,
  });

  return { ok: true };
}

export async function processAccountEmailQueue(
  sender: AccountEmailSender = defaultAccountEmailSender,
  batchSize = 20
): Promise<{ processed: number; sent: number; failed: number }> {
  const { claimPendingAccountEmails } = await import(
    "@/lib/email/account-email-queue-repository"
  );
  const messages = await claimPendingAccountEmails(batchSize);

  let sent = 0;
  let failed = 0;

  for (const message of messages) {
    try {
      const result = await sender(message);
      if (result.ok) {
        await markAccountEmailSent(message.id);
        sent += 1;
      } else {
        await markAccountEmailFailed(
          message.id,
          result.error ?? "Falha ao enviar e-mail."
        );
        failed += 1;
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Falha ao enviar e-mail.";
      await markAccountEmailFailed(message.id, errorMessage);
      failed += 1;
    }
  }

  return { processed: messages.length, sent, failed };
}
