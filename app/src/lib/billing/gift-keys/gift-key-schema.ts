export const GIFT_KEY_STATUSES = [
  "available",
  "redeemed",
  "revoked",
  "expired",
] as const;

export type GiftKeyStatus = (typeof GIFT_KEY_STATUSES)[number];

export const GIFT_KEY_CODE_PATTERN = /^[A-Z0-9]{8}$/;

export function isGiftKeyStatus(value: string): value is GiftKeyStatus {
  return (GIFT_KEY_STATUSES as readonly string[]).includes(value);
}

export function normalizeGiftKeyCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}
