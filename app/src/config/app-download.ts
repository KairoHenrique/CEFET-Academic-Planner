/**
 * Sideload Android (M16).
 *
 * APK (~77 MiB) fica no **Cloudflare R2** (Workers Assets = máx. 25 MiB).
 * URL pública r2.dev — permanente enquanto o objeto existir no bucket.
 *
 * Site **v1.0.1** (jul/2026): correções de bugs web + app (Expo Go).
 * APK no R2 ainda `ACME-HUB-1.0.0.apk` até rebuild EAS aprovado.
 */
export const APP_RELEASE = {
  version: "1.0.1",
  apkFile: "ACME-HUB-1.0.0.apk",
  /** Download permanente (R2). */
  apkPath:
    "https://pub-b2b330087a284ca886367469abf1924b.r2.dev/ACME-HUB-1.0.0.apk",
  pagePath: "/download",
  label: "Baixar app Android",
  shortLabel: "Baixar app",
  r2Bucket: "acme-hub-releases",
  easBuildUrl:
    "https://expo.dev/accounts/kairohfm/projects/acme-hub/builds/95f55bb8-6d1d-4819-8ee9-625f620db8f1",
} as const;

export function appApkAbsoluteUrl(_origin?: string): string {
  return APP_RELEASE.apkPath;
}

export function appDownloadPageAbsoluteUrl(origin: string): string {
  const base = origin.replace(/\/$/, "");
  return `${base}${APP_RELEASE.pagePath}`;
}
