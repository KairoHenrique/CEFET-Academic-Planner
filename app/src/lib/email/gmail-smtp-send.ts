import type { AccountEmailSendResult } from "@/lib/email/process-account-email-queue";
import { parseEmailAddress } from "@/lib/email/email-from";
import { RECIPIENT_PATTERN } from "@/lib/email/email-send-shared";

/**
 * Envio SMTP via Gmail (senha de app) — roda só no PC worker (Node), não no
 * Cloudflare. Gmail entrega de verdade; Brevo free com *.brevosend.com não.
 */
export interface GmailSmtpConfig {
  user: string;
  appPassword: string;
  from: { name: string | null; email: string };
}

export function resolveGmailSmtpConfig(
  env: NodeJS.ProcessEnv = process.env
): GmailSmtpConfig | null {
  const user = env.GMAIL_SMTP_USER?.trim();
  const appPassword = env.GMAIL_SMTP_APP_PASSWORD?.trim().replace(/\s+/g, "");
  if (!user || !appPassword) {
    return null;
  }

  const fromRaw = env.EMAIL_FROM?.trim() || `ACME HUB <${user}>`;
  const from = parseEmailAddress(fromRaw);

  return {
    user,
    appPassword,
    from: {
      name: from.name ?? "ACME HUB",
      email: from.email.includes("@") ? from.email : user,
    },
  };
}

export interface GmailSmtpMessage {
  toEmail: string;
  subject: string;
  bodyText: string;
  bodyHtml?: string;
}

export async function sendViaGmailSmtp(
  config: GmailSmtpConfig,
  message: GmailSmtpMessage
): Promise<AccountEmailSendResult> {
  if (!RECIPIENT_PATTERN.test(message.toEmail)) {
    return { ok: false, error: "Destinatário inválido.", retryable: false };
  }

  try {
    // Import dinâmico: nodemailer só no runtime Node do worker.
    const nodemailer = await import("nodemailer");
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: config.user,
        pass: config.appPassword,
      },
    });

    await transporter.sendMail({
      from: config.from.name
        ? `"${config.from.name}" <${config.from.email}>`
        : config.from.email,
      to: message.toEmail,
      subject: message.subject,
      text: message.bodyText,
      html: message.bodyHtml ?? undefined,
    });

    return { ok: true };
  } catch (error) {
    const detail =
      error instanceof Error ? error.message : "Falha SMTP Gmail.";
    const retryable = !/invalid login|username and password|5\.7\./i.test(
      detail
    );
    return { ok: false, error: `Gmail SMTP: ${detail}`, retryable };
  }
}
