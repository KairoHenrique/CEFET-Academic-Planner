/** Config de anuncios web (AdSense). IDs reais via env no go-live. */
export function resolveAdsenseClientId(): string | null {
  const id = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID?.trim();
  return id || null;
}

export function resolveAdsenseSlotBottom(): string | null {
  return process.env.NEXT_PUBLIC_ADSENSE_SLOT_BOTTOM?.trim() || null;
}

export function resolveAdsenseSlotSidebar(): string | null {
  return process.env.NEXT_PUBLIC_ADSENSE_SLOT_SIDEBAR?.trim() || null;
}

/** Paths onde NUNCA mostrar ads (login, forms criticos, legal, planos/checkout). */
export const WEB_AD_BLOCKED_PATH_PREFIXES = [
  "/login",
  "/cadastro",
  "/register",
  "/termos",
  "/privacidade",
  "/planos",
  "/dev",
  "/download",
] as const;

export function isWebAdPathBlocked(pathname: string): boolean {
  return WEB_AD_BLOCKED_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}
