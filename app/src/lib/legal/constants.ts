export const LEGAL_TERMS_VERSION = "2026-07-01";
export const LEGAL_PRIVACY_VERSION = "2026-07-01";

export const LEGAL_ROUTES = {
  terms: "/termos",
  privacy: "/privacidade",
} as const;

export const LEGAL_CONTACT_EMAIL_DEFAULT = "acme.hubsuporte@gmail.com";

export function resolveLegalContactEmail(): string {
  const fromEnv = process.env.LEGAL_CONTACT_EMAIL?.trim();
  return fromEnv || LEGAL_CONTACT_EMAIL_DEFAULT;
}

export function buildLegalMeta() {
  return {
    termsVersion: LEGAL_TERMS_VERSION,
    privacyVersion: LEGAL_PRIVACY_VERSION,
    contactEmail: resolveLegalContactEmail(),
    routes: LEGAL_ROUTES,
  } as const;
}
