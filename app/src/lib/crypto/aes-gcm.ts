import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_BYTES = 12;

export interface EncryptedPayload {
  v: 1;
  iv: string;
  tag: string;
  data: string;
}

function deriveKey(): Buffer {
  const secret = process.env.CREDENTIALS_ENCRYPTION_KEY?.trim();
  if (!secret || secret.length < 16) {
    throw new Error(
      "CREDENTIALS_ENCRYPTION_KEY ausente ou curta demais (mín. 16 caracteres)."
    );
  }

  return createHash("sha256").update(secret).digest();
}

export function encryptSecret(plaintext: string): string {
  const key = deriveKey();
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  const payload: EncryptedPayload = {
    v: 1,
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
    data: encrypted.toString("base64"),
  };

  return JSON.stringify(payload);
}

export function decryptSecret(payloadRaw: string): string {
  const parsed = JSON.parse(payloadRaw) as EncryptedPayload;

  if (parsed.v !== 1) {
    throw new Error("Versão de criptografia não suportada.");
  }

  const key = deriveKey();
  const decipher = createDecipheriv(
    ALGORITHM,
    key,
    Buffer.from(parsed.iv, "base64")
  );
  decipher.setAuthTag(Buffer.from(parsed.tag, "base64"));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(parsed.data, "base64")),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}

export function isCredentialEncryptionConfigured(): boolean {
  const secret = process.env.CREDENTIALS_ENCRYPTION_KEY?.trim();
  return Boolean(secret && secret.length >= 16);
}
