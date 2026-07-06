import { cpfLast4, maskCpf } from "@/lib/dev-panel/mask-cpf";
import { redactSensitiveText } from "@/lib/security/safe-log";

const BLOCKED_KEYS = new Set([
  "cpf",
  "password",
  "senha",
  "sigaa_password",
  "sigaa_password_enc",
  "password_enc",
]);

function sanitizeAuditValue(key: string, value: unknown): unknown {
  if (BLOCKED_KEYS.has(key)) {
    return "[redacted]";
  }

  if (key === "email" && typeof value === "string") {
    const [local, domain] = value.split("@");
    if (!domain) return "[email-redacted]";
    return `${local.slice(0, 2)}***@${domain}`;
  }

  if (typeof value === "string") {
    if (/^\d{11}$/.test(value)) {
      return maskCpf(value);
    }
    return redactSensitiveText(value);
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeAuditNode(item));
  }

  if (value && typeof value === "object") {
    return sanitizeAuditNode(value as Record<string, unknown>);
  }

  return value;
}

function sanitizeAuditNode(node: Record<string, unknown>): Record<string, unknown> {
  const output: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(node)) {
    if (key === "cpf" && typeof value === "string") {
      output.cpfMasked = maskCpf(value);
      output.cpfLast4 = cpfLast4(value);
      continue;
    }

    output[key] = sanitizeAuditValue(key, value);
  }

  return output;
}

export function sanitizeAuditDetail(
  detail: Record<string, unknown>
): Record<string, unknown> {
  return sanitizeAuditNode(detail);
}
