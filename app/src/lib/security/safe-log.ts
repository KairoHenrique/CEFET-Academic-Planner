const CPF_PATTERN = /\b\d{11}\b/g;
const EMAIL_PATTERN = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const PASSWORD_KEY_PATTERN = /(password|senha|sigaa_password|sigaaPasswordEnc)/i;
const JWT_PATTERN = /eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g;

function redactString(value: string): string {
  return value
    .replace(CPF_PATTERN, "[cpf-redacted]")
    .replace(EMAIL_PATTERN, "[email-redacted]")
    .replace(PASSWORD_KEY_PATTERN, "[secret-field]")
    .replace(JWT_PATTERN, "[jwt-redacted]");
}

export function redactSensitiveText(value: string): string {
  return redactString(value);
}

export function logSafeError(scope: string, error: unknown): void {
  if (process.env.NODE_ENV === "production") {
    let message = "unknown";
    let stack: string | undefined;

    if (error instanceof Error) {
      message = redactString(error.message);
      stack = error.stack ? redactString(error.stack) : undefined;
    } else if (typeof error === "string") {
      message = redactString(error);
    } else {
      try {
        message = redactString(JSON.stringify(error));
      } catch {
        message = "[Unserializable Error]";
      }
    }

    console.error(scope, { message, stack });
    return;
  }

  console.error(scope, error);
}
