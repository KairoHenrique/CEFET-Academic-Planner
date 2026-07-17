import { renderAccountEmailHtml } from "@/lib/email/account-email-html";
import type { BrevoConfig } from "@/lib/email/brevo-config";
import {
  RECIPIENT_PATTERN,
  isRetryableHttpStatus,
} from "@/lib/email/email-send-shared";
import type {
  AccountEmailSendResult,
  AccountEmailSender,
} from "@/lib/email/process-account-email-queue";

/**
 * Sender transacional via REST API da Brevo (B62b) — sem SDK: apenas `fetch`,
 * compatível com o runtime do Cloudflare Workers.
 * Doc: POST https://api.brevo.com/v3/smtp/email (header `api-key`).
 */
const BREVO_ENDPOINT = "https://api.brevo.com/v3/smtp/email";

interface BrevoErrorBody {
  message?: string;
  code?: string;
}

export function createBrevoAccountEmailSender(
  config: BrevoConfig
): AccountEmailSender {
  const sender = config.sender.name
    ? { name: config.sender.name, email: config.sender.email }
    : { email: config.sender.email };

  return async function brevoAccountEmailSender(
    message
  ): Promise<AccountEmailSendResult> {
    if (!RECIPIENT_PATTERN.test(message.toEmail)) {
      return { ok: false, error: "Destinatário inválido.", retryable: false };
    }

    try {
      const response = await fetch(BREVO_ENDPOINT, {
        method: "POST",
        headers: {
          "api-key": config.apiKey,
          "content-type": "application/json",
          accept: "application/json",
        },
        body: JSON.stringify({
          sender,
          to: [{ email: message.toEmail }],
          subject: message.subject,
          htmlContent: renderAccountEmailHtml(message.subject, message.bodyText),
          textContent: message.bodyText,
          ...(config.replyTo ? { replyTo: { email: config.replyTo } } : {}),
        }),
      });

      if (response.ok) {
        return { ok: true };
      }

      const body = (await response.json().catch(() => ({}))) as BrevoErrorBody;
      const detail = body.message ?? `HTTP ${response.status}`;
      return {
        ok: false,
        error: `Brevo: ${detail}`,
        retryable: isRetryableHttpStatus(response.status),
      };
    } catch (error) {
      const detail =
        error instanceof Error ? error.message : "Falha de rede ao enviar.";
      return { ok: false, error: `Brevo: ${detail}`, retryable: true };
    }
  };
}
