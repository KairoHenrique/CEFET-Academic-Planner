"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { APP_RELEASE } from "@/config/app-download";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { Icon } from "@/components/ui/Icon";
import { AppDownloadQr } from "@/components/download/AppDownloadQr";

type Manifest = {
  version?: string;
  apk?: string;
  published?: boolean;
};

/**
 * Página pública de download — QR (desktop) + botão direto (mobile).
 * Sem navbar aluno; link seguro para leitura fora da sessão.
 */
export function DownloadPageClient() {
  const [manifest, setManifest] = useState<Manifest | null>(null);

  useEffect(() => {
    void fetch("/releases/manifest.json", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: Manifest | null) => setManifest(data))
      .catch(() => setManifest(null));
  }, []);

  const published = manifest?.published === true;
  const version = manifest?.version ?? APP_RELEASE.version;

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

        {!published ? (
          <div className="app-dl-page-banner" role="status">
            O APK ainda não foi publicado neste ambiente. O botão abaixo aponta
            para <code>{APP_RELEASE.apkPath}</code> — após o build EAS, cole o
            arquivo em <code>public/releases/</code> e marque{" "}
            <code>published: true</code> no manifest.
          </div>
        ) : null}

        <div className="app-dl-page-qr-wrap" aria-hidden={false}>
          <AppDownloadQr size={240} />
          <p className="app-dl-page-qr-caption">
            QR → esta página (útil no desktop)
          </p>
        </div>

        <a
          href={APP_RELEASE.apkPath}
          className="btn-gold app-dl-page-cta"
          download={published ? APP_RELEASE.apkFile : undefined}
        >
          <Icon name="download" size={18} />
          Baixar APK {version}
        </a>

        <p className="app-dl-page-meta">
          Arquivo: <code>{APP_RELEASE.apkFile}</code>
        </p>

        <Link href="/login" className="app-dl-page-back">
          Voltar ao login
        </Link>
      </div>
    </div>
  );
}
