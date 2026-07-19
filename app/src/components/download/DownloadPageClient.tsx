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
 * Página pública de download — QR + CTA apontam pro APK no R2.
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
          Instale o APK no celular. No Android, pode ser preciso permitir
          “fontes desconhecidas” para o instalador.
        </p>

        <div className="app-dl-page-qr-wrap" aria-hidden={false}>
          <AppDownloadQr size={240} url={apkHref} />
          <p className="app-dl-page-qr-caption">
            QR → download direto do APK
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

        <Link href="/login" className="app-dl-page-back">
          Voltar ao login
        </Link>
      </div>
    </div>
  );
}
