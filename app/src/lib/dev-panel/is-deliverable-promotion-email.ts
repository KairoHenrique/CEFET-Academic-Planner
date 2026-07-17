/**
 * Destinatários elegíveis para e-mail de promoção (B73).
 *
 * Exclui contas de smoke/teste e domínios reservados (RFC 2606) para não
 * gastar crédito do Brevo nem poluir a fila com endereços que nunca entregam.
 */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Domínios / TLDs que nunca devem receber campanha. */
const BLOCKED_DOMAIN_EXACT = new Set([
  "smoke.test",
  "example.com",
  "example.org",
  "example.net",
  "example.edu",
  "test.com",
  "localhost",
  "invalid",
  "local",
]);

const BLOCKED_DOMAIN_SUFFIXES = [
  ".smoke.test",
  ".example.com",
  ".example.org",
  ".example.net",
  ".test",
  ".invalid",
  ".localhost",
  ".local",
] as const;

function resolveEmailDomain(email: string): string | null {
  const at = email.lastIndexOf("@");
  if (at < 0) return null;
  return email.slice(at + 1).toLowerCase();
}

function isBlockedDomain(domain: string): boolean {
  if (BLOCKED_DOMAIN_EXACT.has(domain)) {
    return true;
  }
  return BLOCKED_DOMAIN_SUFFIXES.some(
    (suffix) => domain === suffix.slice(1) || domain.endsWith(suffix)
  );
}

/** Local-part típico de fixture (smoke-*, test-*, t2-*). */
function isBlockedLocalPart(local: string): boolean {
  const lower = local.toLowerCase();
  return (
    lower.startsWith("smoke-") ||
    lower.startsWith("smoke_") ||
    lower.startsWith("t2-") ||
    lower === "smoke" ||
    lower === "test"
  );
}

/**
 * E-mail real o bastante para receber promoção.
 * Retorna false para formato inválido, domínio de teste ou local-part de fixture.
 */
export function isDeliverablePromotionEmail(
  email: string | null | undefined
): email is string {
  if (typeof email !== "string") {
    return false;
  }

  const trimmed = email.trim();
  if (!EMAIL_PATTERN.test(trimmed)) {
    return false;
  }

  const domain = resolveEmailDomain(trimmed);
  if (!domain || isBlockedDomain(domain)) {
    return false;
  }

  const local = trimmed.slice(0, trimmed.lastIndexOf("@"));
  if (isBlockedLocalPart(local)) {
    return false;
  }

  return true;
}
