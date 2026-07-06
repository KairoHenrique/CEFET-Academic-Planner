import { internalError } from "@/lib/api/errors";
import { generateUniqueGiftKeyCodes } from "./generate-gift-key-code";
import { insertGiftKeys } from "./gift-key-repository";
import type { CreateGiftKeysInput } from "./parse-create-gift-keys-request";

export async function createGiftKeysBatch(
  input: CreateGiftKeysInput,
  createdBy: string
) {
  const codes = generateUniqueGiftKeyCodes(input.count);
  const keys = await insertGiftKeys({
    codes,
    planId: input.planId,
    durationDays: input.durationDays,
    createdBy,
    internalLabel: input.internalLabel,
    keyExpiresAt: input.keyExpiresAt,
  });

  if (keys.length !== input.count) {
    throw internalError("Falha ao persistir lote de chaves gift.");
  }

  return {
    ok: true as const,
    count: keys.length,
    keys,
  };
}
