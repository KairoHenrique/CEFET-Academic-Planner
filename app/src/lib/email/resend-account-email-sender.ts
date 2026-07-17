import { renderAccountEmailHtml } from "@/lib/email/account-email-html";
import {
  RECIPIENT_PATTERN,
  isRetryableHttpStatus,
} from "@/lib/email/email-send-shared";
import type {
  AccountEmailSendResult,
  AccountEmailSender,
} from "@/lib/email/process-account-email-queue";
import type { ResendConfig } from "@/lib/email/resend-config";

/**
 * Sender transacional via REST API do Resend (B62b) — sem SDK: apenas `fetch`,
 * compatível com o runtime do Cloudflare Workers e sem dependência extra.
 * Requer domínio verificado no Resend (alternativa ao Brevo).
 */
const RESEND_ENDPOINT = "https://api.resend.com/emails";

interface ResendErrorBody {
  message?: string;
  name?: string;
}

export function createResendAccountEmailSender(
  config: ResendConfig
): AccountEmailSender {
  return async function resendAccountEmailSender(
    message
  ): Promise<AccountEmailSendResult> {
    if (!RECIPIENT_PATTERN.test(message.toEmail)) {
      return { ok: false, error: "Destinatário inválido.", retryable: false };
    }

    try {
      const response = await fetch(RESEND_ENDPOINT, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: config.from,
          to: [message.toEmail],
          subject: message.subject,
          text: message.bodyText,
          html: renderAccountEmailHtml(message.subject, message.bodyText),
          ...(config.replyTo ? { reply_to: config.replyTo } : {}),
        }),
      });

      if (response.ok) {
        return { ok: true };
      }

      const body = (await response
        .json()
        .catch(() => ({}))) as ResendErrorBody;
      const detail = body.message ?? `HTTP ${response.status}`;
      return {
        ok: false,
        error: `Resend: ${detail}`,
        retryable: isRetryableHttpStatus(response.status),
      };
    } catch (error) {
      const detail =
        error instanceof Error ? error.message : "Falha de rede ao enviar.";
      return { ok: false, error: `Resend: ${detail}`, retryable: true };
    }
  };
}
