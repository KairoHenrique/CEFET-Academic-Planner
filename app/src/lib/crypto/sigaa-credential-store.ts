import {
  decryptSecret,
  encryptSecret,
  isCredentialEncryptionConfigured,
} from "@/lib/crypto/aes-gcm";
import { getConfig, setConfig } from "@/lib/db/queries";
import { logSafeError } from "@/lib/security/safe-log";
import { assertCredentialHardeningForRuntime } from "@/lib/security/credential-hardening";

const CONFIG_USERNAME = "sigaa.username";
const CONFIG_PASSWORD_ENC = "sigaa.password_enc";
const CONFIG_REMEMBER = "sigaa.remember_password";

export interface StoredSigaaCredentials {
  username: string;
  password: string;
}

export function persistSigaaCredentials(
  username: string,
  password: string
): void {
  assertCredentialHardeningForRuntime("persistência local SIGAA");

  if (!isCredentialEncryptionConfigured()) {
    console.warn(
      "[crypto] CREDENTIALS_ENCRYPTION_KEY não configurada — senha não foi persistida."
    );
    return;
  }

  setConfig(CONFIG_USERNAME, username.trim());
  setConfig(CONFIG_PASSWORD_ENC, encryptSecret(password));
  setConfig(CONFIG_REMEMBER, "1");
}

export function loadSigaaCredentials(): StoredSigaaCredentials | null {
  if (getConfig(CONFIG_REMEMBER) !== "1") {
    return null;
  }

  const username = getConfig(CONFIG_USERNAME)?.trim();
  const encrypted = getConfig(CONFIG_PASSWORD_ENC);

  if (!username || !encrypted) {
    return null;
  }

  if (!isCredentialEncryptionConfigured()) {
    return null;
  }

  try {
    return {
      username,
      password: decryptSecret(encrypted),
    };
  } catch (error) {
    logSafeError("[crypto] falha ao decifrar credenciais SIGAA", error);
    return null;
  }
}

export function clearSigaaCredentials(): void {
  setConfig(CONFIG_REMEMBER, "0");
  setConfig(CONFIG_PASSWORD_ENC, "");
}
