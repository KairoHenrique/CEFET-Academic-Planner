import {
  decryptSecret,
  encryptSecret,
  isCredentialEncryptionConfigured,
} from "@/lib/crypto/aes-gcm";
import { ApiError } from "@/lib/api/errors";

export function sealQueuePassword(password: string): string {
  if (!isCredentialEncryptionConfigured()) {
    throw new ApiError(
      "INTERNAL_ERROR",
      "CREDENTIALS_ENCRYPTION_KEY é obrigatória para enfileirar sync.",
      500
    );
  }

  return encryptSecret(password);
}

export function openQueuePassword(passwordEnc: string): string {
  return decryptSecret(passwordEnc);
}

export function scrubQueuePassword(passwordEnc: string): string {
  return passwordEnc.length > 0 ? "[redacted]" : "";
}
