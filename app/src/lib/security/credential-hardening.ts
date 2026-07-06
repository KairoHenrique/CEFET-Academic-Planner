import { internalError } from "@/lib/api/errors";
import { isCredentialEncryptionConfigured } from "@/lib/crypto/aes-gcm";

export function isProductionRuntime(): boolean {
  return process.env.NODE_ENV === "production";
}

export function assertCredentialEncryptionReady(context: string): void {
  if (!isCredentialEncryptionConfigured()) {
    throw internalError(
      `CREDENTIALS_ENCRYPTION_KEY é obrigatória (${context}).`
    );
  }
}

export function assertCredentialHardeningForRuntime(context: string): void {
  if (!isProductionRuntime()) {
    return;
  }

  assertCredentialEncryptionReady(context);
}
