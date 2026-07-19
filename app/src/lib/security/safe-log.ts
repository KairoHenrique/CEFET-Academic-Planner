const CPF_PATTERN = /\b\d{11}\b/g;
const EMAIL_PATTERN = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const PASSWORD_KEY_PATTERN = /(password|senha|sigaa_password)/i;

function redactString(value: string): string {
  return value
    .replace(CPF_PATTERN, "[cpf-redacted]")
    .replace(EMAIL_PATTERN, "[email-redacted]")
    .replace(PASSWORD_KEY_PATTERN, "[secret-field]");
}

export function redactSensitiveText(value: string): string {
  return redactString(value);
}

export function logSafeError(scope: string, error: unknown): void {
  if (process.env.NODE_ENV === "production") {
    const message =
      error instanceof Error ? redactString(error.message) : "unknown";
    console.error(scope, { message });
    return;
  }

  console.error(scope, error);
}
