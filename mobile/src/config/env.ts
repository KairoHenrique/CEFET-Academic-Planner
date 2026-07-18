/**
 * URL do site ACME HUB (= F28 mobile web).
 * mobile/.env → EXPO_PUBLIC_API_BASE_URL=https://acme-hub.khfm.workers.dev
 */
import Constants from "expo-constants";

export function getWebBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
  const fromExtra = (
    Constants.expoConfig?.extra as { apiBaseUrl?: string } | undefined
  )?.apiBaseUrl?.trim();
  const base = (fromEnv || fromExtra || "").replace(/\/$/, "");
  if (!base) {
    throw new Error(
      "EXPO_PUBLIC_API_BASE_URL ausente. Crie mobile/.env com a URL do site."
    );
  }
  return base;
}

/** Alias — API e site compartilham a mesma origem cloud. */
export const getApiBaseUrl = getWebBaseUrl;

export function hasWebBaseUrl(): boolean {
  try {
    getWebBaseUrl();
    return true;
  } catch {
    return false;
  }
}

export const hasApiBaseUrl = hasWebBaseUrl;
