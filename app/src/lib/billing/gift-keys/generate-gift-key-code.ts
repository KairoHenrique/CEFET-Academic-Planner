import { randomBytes } from "node:crypto";
import { GIFT_KEY_CODE_PATTERN } from "./gift-key-schema";

const GIFT_KEY_CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateGiftKeyCode(): string {
  const bytes = randomBytes(8);
  let code = "";

  for (let index = 0; index < 8; index += 1) {
    const charIndex = bytes[index]! % GIFT_KEY_CHARSET.length;
    code += GIFT_KEY_CHARSET.charAt(charIndex);
  }

  if (!GIFT_KEY_CODE_PATTERN.test(code)) {
    return generateGiftKeyCode();
  }

  return code;
}

export function generateUniqueGiftKeyCodes(count: number): string[] {
  const codes = new Set<string>();

  while (codes.size < count) {
    codes.add(generateGiftKeyCode());
  }

  return [...codes];
}
