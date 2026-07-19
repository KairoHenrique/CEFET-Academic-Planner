/**
 * Sideload Android (M16).
 *
 * APK (~77 MiB) fica no **Cloudflare R2** (Workers Assets = máx. 25 MiB).
 * URL pública r2.dev — permanente enquanto o objeto existir no bucket.
 */
export const APP_RELEASE = {
  version: "1.0.0",
  apkFile: "ACME-HUB-1.0.0.apk",
  /** Download permanente (R2). */
  apkPath:
    "https://pub-b2b330087a284ca886367469abf1924b.r2.dev/ACME-HUB-1.0.0.apk",
  pagePath: "/download",
  label: "Baixar app Android",
  shortLabel: "Baixar app",
  r2Bucket: "acme-hub-releases",
  easBuildUrl:
    "https://expo.dev/accounts/kairohfm/projects/acme-hub/builds/6e1a53d6-5d58-460c-99cf-30ececd48766",
} as const;

export function appApkAbsoluteUrl(_origin?: string): string {
  return APP_RELEASE.apkPath;
}

export function appDownloadPageAbsoluteUrl(origin: string): string {
  const base = origin.replace(/\/$/, "");
  return `${base}${APP_RELEASE.pagePath}`;
}
