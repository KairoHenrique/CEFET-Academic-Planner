const PENDING_GIFT_KEY_STORAGE = "planner-pending-gift-key";

export function savePendingGiftKey(code: string): void {
  if (typeof window === "undefined") {
    return;
  }

  sessionStorage.setItem(PENDING_GIFT_KEY_STORAGE, code.trim().toUpperCase());
}

export function readPendingGiftKey(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return sessionStorage.getItem(PENDING_GIFT_KEY_STORAGE);
}

export function clearPendingGiftKey(): void {
  if (typeof window === "undefined") {
    return;
  }

  sessionStorage.removeItem(PENDING_GIFT_KEY_STORAGE);
}
