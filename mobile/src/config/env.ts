import Constants from "expo-constants";

/**
 * Base URL da API Next (cloud).
 * Defina em `mobile/.env`: EXPO_PUBLIC_API_BASE_URL=https://...
 * Sem trailing slash.
 */
export function getApiBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
  const fromExtra = (
    Constants.expoConfig?.extra as { apiBaseUrl?: string } | undefined
  )?.apiBaseUrl?.trim();
  const base = (fromEnv || fromExtra || "").replace(/\/$/, "");
  if (!base) {
    throw new Error(
      "EXPO_PUBLIC_API_BASE_URL ausente. Crie mobile/.env com a URL do ACME HUB."
    );
  }
  return base;
}

export function hasApiBaseUrl(): boolean {
  try {
    getApiBaseUrl();
    return true;
  } catch {
    return false;
  }
}
