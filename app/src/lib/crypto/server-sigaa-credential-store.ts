import { normalizeCpf } from "@/lib/auth/account/cpf";
import {
  findEncryptedPasswordByCpf,
  updateSigaaPasswordEnc,
} from "@/lib/auth/account/profile-repository";
import { ApiError } from "@/lib/api/errors";
import {
  decryptSecret,
  encryptSecret,
  isCredentialEncryptionConfigured,
} from "@/lib/crypto/aes-gcm";
import type { StoredSigaaCredentials } from "@/lib/crypto/sigaa-credential-store";

export function assertServerCredentialEncryptionReady(): void {
  if (!isCredentialEncryptionConfigured()) {
    throw new ApiError(
      "INTERNAL_ERROR",
      "CREDENTIALS_ENCRYPTION_KEY é obrigatória para credenciais server-side.",
      500
    );
  }
}

export function sealServerSigaaPassword(password: string): string {
  assertServerCredentialEncryptionReady();
  return encryptSecret(password);
}

export function openServerSigaaPassword(passwordEnc: string): string {
  assertServerCredentialEncryptionReady();
  return decryptSecret(passwordEnc);
}

export async function persistServerSigaaCredentials(
  cpf: string,
  password: string
): Promise<void> {
  const normalized = normalizeCpf(cpf);
  const sealed = sealServerSigaaPassword(password);
  await updateSigaaPasswordEnc(normalized, sealed);
}

export async function loadServerSigaaCredentials(
  cpf: string
): Promise<StoredSigaaCredentials | null> {
  if (!isCredentialEncryptionConfigured()) {
    return null;
  }

  const normalized = normalizeCpf(cpf);
  const encrypted = await findEncryptedPasswordByCpf(normalized);
  if (!encrypted) {
    return null;
  }

  try {
    return {
      username: normalized,
      password: openServerSigaaPassword(encrypted),
    };
  } catch (error) {
    console.error("[crypto] falha ao decifrar credencial server-side", error);
    return null;
  }
}

export async function openServerSigaaCredentialsForWorker(
  cpf: string
): Promise<StoredSigaaCredentials> {
  const credentials = await loadServerSigaaCredentials(cpf);
  if (!credentials) {
    throw new ApiError(
      "NOT_FOUND",
      "Credenciais SIGAA não encontradas no servidor para este CPF.",
      404
    );
  }

  return credentials;
}
