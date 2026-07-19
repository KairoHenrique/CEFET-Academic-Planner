"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { APP_RELEASE } from "@/config/app-download";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { Icon } from "@/components/ui/Icon";
import { AppDownloadQr } from "@/components/download/AppDownloadQr";

type Manifest = {
  version?: string;
  published?: boolean;
  apkUrl?: string;
  hosting?: string;
};

/**
 * Página pública de download — QR → /download; CTA → artefato EAS/R2.
 */
export function DownloadPageClient() {
  const [manifest, setManifest] = useState<Manifest | null>(null);

  useEffect(() => {
    void fetch("/releases/manifest.json", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: Manifest | null) => setManifest(data))
      .catch(() => setManifest(null));
  }, []);

  const version = manifest?.version ?? APP_RELEASE.version;
  const apkHref = manifest?.apkUrl?.trim() || APP_RELEASE.apkPath;
  const viaEas = (manifest?.hosting ?? "eas-artifact") === "eas-artifact";

  return (
    <div className="app-dl-page">
      <div className="app-dl-page-card">
        <div className="app-dl-page-brand">
          <BrandLogo />
          <div>
            <p className="app-dl-page-eyebrow">ACME HUB</p>
            <h1>App Android v{version}</h1>
          </div>
        </div>

        <p className="app-dl-page-lead">
          Instale o APK no celular (sideload · sem Play Store). No Android, pode
          ser preciso permitir “fontes desconhecidas” para o instalador.
        </p>

        {viaEas ? (
          <div className="app-dl-page-banner" role="status">
            Download via build EAS (Cloudflare não hospeda arquivos &gt; 25 MiB).
            O link do artefato é válido por ~14 dias após o build.
          </div>
        ) : null}

        <div className="app-dl-page-qr-wrap" aria-hidden={false}>
          <AppDownloadQr size={240} />
          <p className="app-dl-page-qr-caption">
            QR → esta página (útil no desktop)
          </p>
        </div>

        <a
          href={apkHref}
          className="btn-gold app-dl-page-cta"
          rel="noopener noreferrer"
        >
          <Icon name="download" size={18} />
          Baixar APK {version}
        </a>

        <p className="app-dl-page-meta">
          Build:{" "}
          <a href={APP_RELEASE.easBuildUrl} rel="noopener noreferrer">
            Expo / EAS
          </a>
        </p>

        <Link href="/login" className="app-dl-page-back">
          Voltar ao login
        </Link>
      </div>
    </div>
  );
}
