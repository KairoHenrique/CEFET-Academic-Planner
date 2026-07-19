/**
 * Sideload Android (M16).
 *
 * Cloudflare Workers Assets = máx. **25 MiB** por arquivo — o APK (~77 MiB)
 * NÃO pode ir em `public/releases/`. Cópia local: `app/.data/releases/`.
 *
 * Download público usa o artefato EAS (link ~14 dias) até haver R2/hosting >25MB.
 */
export const APP_RELEASE = {
  version: "1.0.0",
  apkFile: "acme-hub-1.0.0.apk",
  /**
   * URL usada por QR, botão do drawer e `/download`.
   * Atualize após novo `eas build` (build:view → applicationArchiveUrl).
   */
  apkPath:
    "https://expo.dev/artifacts/eas/iBTGIPhjlo8Nh1ytrSHEk60pOunTCuuq5blXi_fbZvM.apk",
  pagePath: "/download",
  label: "Baixar app Android",
  shortLabel: "Baixar app",
  easBuildUrl:
    "https://expo.dev/accounts/kairohfm/projects/acme-hub/builds/d6061094-4c3f-4102-b522-ec0ed461d1e9",
} as const;

export function appApkAbsoluteUrl(_origin?: string): string {
  return APP_RELEASE.apkPath;
}

export function appDownloadPageAbsoluteUrl(origin: string): string {
  const base = origin.replace(/\/$/, "");
  return `${base}${APP_RELEASE.pagePath}`;
}
