import fs from "node:fs";
import path from "node:path";
import type { AccountEmailSendResult } from "@/lib/email/process-account-email-queue";
import { ACCOUNT_EMAIL_LOGO_CID } from "@/lib/email/account-email-html";
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

/** Resolve `public/logo_v2.png` a partir do cwd do app/worker. */
function resolveLogoFilePath(): string | null {
  const candidates = [
    path.join(process.cwd(), "public", "logo_v2.png"),
    path.join(process.cwd(), "app", "public", "logo_v2.png"),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return null;
}

/**
 * Troca qualquer src remoto da logo por cid:… e devolve o anexo inline.
 * Gmail costuma quebrar `<img>` apontando para *.workers.dev.
 */
function embedLogoInHtml(html: string): {
  html: string;
  attachments: Array<{ filename: string; path: string; cid: string }>;
} {
  const logoPath = resolveLogoFilePath();
  if (!logoPath) {
    return { html, attachments: [] };
  }

  const cidSrc = `cid:${ACCOUNT_EMAIL_LOGO_CID}`;
  const rewritten = html
    .replace(/src="https?:\/\/[^"]*\/logo_v2\.png"/gi, `src="${cidSrc}"`)
    .replace(/src="cid:acme-logo"/gi, `src="${cidSrc}"`);

  return {
    html: rewritten,
    attachments: [
      {
        filename: "logo_v2.png",
        path: logoPath,
        cid: ACCOUNT_EMAIL_LOGO_CID,
      },
    ],
  };
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

    const embedded = message.bodyHtml
      ? embedLogoInHtml(message.bodyHtml)
      : { html: undefined as string | undefined, attachments: [] };

    await transporter.sendMail({
      from: config.from.name
        ? `"${config.from.name}" <${config.from.email}>`
        : config.from.email,
      to: message.toEmail,
      subject: message.subject,
      text: message.bodyText,
      html: embedded.html,
      attachments: embedded.attachments,
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
