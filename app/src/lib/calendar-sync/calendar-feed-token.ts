import { resolveAppUrl } from "@/lib/email/email-links";

const TOKEN_BYTES = 32;
/** 32 bytes em base64url sem padding = 43 caracteres. */
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function generateCalendarFeedToken(): string {
  const bytes = new Uint8Array(TOKEN_BYTES);
  crypto.getRandomValues(bytes);
  return toBase64Url(bytes);
}

export function isWellFormedCalendarFeedToken(token: string): boolean {
  return TOKEN_PATTERN.test(token);
}

/** Só o hash vai para o banco: um vazamento da tabela não expõe links válidos. */
export async function hashCalendarFeedToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return toHex(digest);
}

export function buildCalendarFeedUrls(token: string): { feedUrl: string; webcalUrl: string } {
  const feedUrl = resolveAppUrl(`/api/calendar-feed/${token}`);
  return { feedUrl, webcalUrl: feedUrl.replace(/^https?:\/\//, "webcal://") };
}
