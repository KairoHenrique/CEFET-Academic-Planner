import {
  ACCOUNT_EMAIL_LOGO_CID,
  renderAccountEmailHtml,
} from "@/lib/email/account-email-html";
import {
  RECIPIENT_PATTERN,
  isRetryableHttpStatus,
} from "@/lib/email/email-send-shared";
import type {
  AccountEmailSendResult,
  AccountEmailSender,
} from "@/lib/email/process-account-email-queue";

/**
 * Encaminha o envio ao worker do PC (SMTP Gmail). O Cloudflare não fala SMTP;
 * o ServidorACME/worker envia com senha de app do Gmail.
 *
 * Cloud secrets: SIGAA_WORKER_URL + WORKER_SHARED_SECRET
 * PC .env.local: GMAIL_SMTP_USER + GMAIL_SMTP_APP_PASSWORD
 */
export interface HomeWorkerEmailDispatchConfig {
  workerUrl: string;
  sharedSecret: string;
}

export function resolveHomeWorkerEmailDispatchConfig(
  env: NodeJS.ProcessEnv = process.env
): HomeWorkerEmailDispatchConfig | null {
  const enabled = env.ACCOUNT_EMAIL_VIA_HOME_WORKER?.trim().toLowerCase();
  if (enabled === "false" || enabled === "0") {
    return null;
  }

  // Liga por padrão quando o flag está true/1 OU quando o env pede "home-gmail".
  const wantsHome =
    enabled === "true" ||
    enabled === "1" ||
    env.ACCOUNT_EMAIL_PROVIDER?.trim().toLowerCase() === "home-gmail";

  if (!wantsHome) {
    return null;
  }

  const workerUrl = env.SIGAA_WORKER_URL?.trim().replace(/\/+$/, "");
  const sharedSecret = env.WORKER_SHARED_SECRET?.trim();
  if (!workerUrl || !sharedSecret || sharedSecret.length < 16) {
    return null;
  }

  return { workerUrl, sharedSecret };
}

export function createHomeWorkerEmailSender(
  config: HomeWorkerEmailDispatchConfig
): AccountEmailSender {
  return async function homeWorkerEmailSender(
    message
  ): Promise<AccountEmailSendResult> {
    if (!RECIPIENT_PATTERN.test(message.toEmail)) {
      return { ok: false, error: "Destinatário inválido.", retryable: false };
    }

    try {
      const response = await fetch(`${config.workerUrl}/email/send`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${config.sharedSecret}`,
          "content-type": "application/json",
          accept: "application/json",
        },
        body: JSON.stringify({
          toEmail: message.toEmail,
          subject: message.subject,
          bodyText: message.bodyText,
          bodyHtml: renderAccountEmailHtml(message.subject, message.bodyText, {
            logoSrc: `cid:${ACCOUNT_EMAIL_LOGO_CID}`,
          }),
        }),
      });

      if (response.ok) {
        return { ok: true };
      }

      const payload = (await response.json().catch(() => ({}))) as {
        message?: string;
        code?: string;
      };
      const detail = payload.message ?? `HTTP ${response.status}`;
      return {
        ok: false,
        error: `Home worker e-mail: ${detail}`,
        retryable:
          response.status === 503 || isRetryableHttpStatus(response.status),
      };
    } catch (error) {
      const detail =
        error instanceof Error ? error.message : "Falha de rede ao worker.";
      return {
        ok: false,
        error: `Home worker e-mail: ${detail}`,
        retryable: true,
      };
    }
  };
}
