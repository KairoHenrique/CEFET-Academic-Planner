export const LEGAL_TERMS_VERSION = "2026-07-01";
export const LEGAL_PRIVACY_VERSION = "2026-07-01";

export const LEGAL_ROUTES = {
  terms: "/termos",
  privacy: "/privacidade",
} as const;

export function resolveLegalContactEmail(): string {
  const fromEnv = process.env.LEGAL_CONTACT_EMAIL?.trim();
  return fromEnv || "privacidade@acme-hub.app";
}

export function buildLegalMeta() {
  return {
    termsVersion: LEGAL_TERMS_VERSION,
    privacyVersion: LEGAL_PRIVACY_VERSION,
    contactEmail: resolveLegalContactEmail(),
    routes: LEGAL_ROUTES,
  } as const;
}
