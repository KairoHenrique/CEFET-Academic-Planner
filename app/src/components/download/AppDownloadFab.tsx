"use client";

import { APP_RELEASE } from "@/config/app-download";
import { AppDownloadQr } from "@/components/download/AppDownloadQr";

/**
 * Widget fixo (canto inferior direito) — só desktop.
 * QR sempre visível + borda dourada + “Baixar app”. Sem modal.
 */
export function AppDownloadFab() {
  return (
    <a
      href={APP_RELEASE.pagePath}
      className="app-dl-fab-root"
      data-tutorial-id="app-download-fab"
      aria-label={`${APP_RELEASE.label} — escanear QR ou abrir página`}
      title="Escaneie o QR no celular ou clique para abrir o download"
    >
      <div className="app-dl-qr-card">
        <div className="app-dl-qr-card-frame">
          <AppDownloadQr size={112} className="app-dl-qr-card-img" />
        </div>
        <span className="app-dl-qr-card-label">Baixar app</span>
      </div>
    </a>
  );
}
