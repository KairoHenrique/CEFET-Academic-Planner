"use client";

import Link from "next/link";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { Icon } from "@/components/ui/Icon";

/**
 * Página pública de download — Aponta para a Play Store
 */
export function DownloadPageClient() {
  const playStoreUrl = "https://play.google.com/store/apps/details?id=br.cefethub.acme";

  return (
    <div className="app-dl-page">
      <div className="app-dl-page-card">
        <div className="app-dl-page-brand">
          <BrandLogo />
          <div>
            <p className="app-dl-page-eyebrow">ACME HUB</p>
            <h1>App Android</h1>
          </div>
        </div>

        <p className="app-dl-page-lead">
          Tenha sua vida acadêmica na palma da mão. Baixe nosso aplicativo oficial na Google Play Store.
        </p>

        <a
          href={playStoreUrl}
          className="btn-gold app-dl-page-cta"
          rel="noopener noreferrer"
          target="_blank"
          style={{ marginTop: "24px" }}
        >
          <Icon name="smartphone" size={18} />
          Obter no Google Play
        </a>

        <Link href="/login" className="app-dl-page-back" style={{ marginTop: "24px" }}>
          Voltar ao login
        </Link>
      </div>
    </div>
  );
}
