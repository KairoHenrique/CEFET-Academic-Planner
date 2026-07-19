/**
 * Sideload Android (M16) — APK hospedado em `public/releases/` no próprio site.
 * Cole o arquivo gerado pelo EAS no path abaixo e ajuste `apkFile`/`published` se o nome mudar.
 */
export const APP_RELEASE = {
  version: "1.0.0",
  /** Nome do arquivo em `public/releases/` */
  apkFile: "acme-hub-1.0.0.apk",
  /** Path público absoluto (servido estático). */
  apkPath: "/releases/acme-hub-1.0.0.apk",
  /** Página pública do download (QR aponta aqui). */
  pagePath: "/download",
  label: "Baixar app Android",
  shortLabel: "Baixar app",
} as const;

export function appApkAbsoluteUrl(origin: string): string {
  const base = origin.replace(/\/$/, "");
  return `${base}${APP_RELEASE.apkPath}`;
}

export function appDownloadPageAbsoluteUrl(origin: string): string {
  const base = origin.replace(/\/$/, "");
  return `${base}${APP_RELEASE.pagePath}`;
}
