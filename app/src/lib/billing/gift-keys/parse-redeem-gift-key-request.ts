import { validationError } from "@/lib/api/errors";
import {
  GIFT_KEY_CODE_PATTERN,
  normalizeGiftKeyCode,
} from "./gift-key-schema";

export function parseRedeemGiftKeyRequest(body: unknown): { code: string } {
  if (!body || typeof body !== "object") {
    throw validationError("Corpo JSON inválido.");
  }

  const record = body as Record<string, unknown>;
  const raw = typeof record.code === "string" ? record.code : "";

  if (!raw.trim()) {
    throw validationError("Campo code é obrigatório.");
  }

  const code = normalizeGiftKeyCode(raw);
  if (!GIFT_KEY_CODE_PATTERN.test(code)) {
    throw validationError("Código inválido. Use 8 caracteres A–Z e 0–9.");
  }

  return { code };
}
