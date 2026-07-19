"use client";

import { useEffect, useId, useState } from "react";
import { APP_RELEASE } from "@/config/app-download";
import { Icon } from "@/components/ui/Icon";
import { AppDownloadQr } from "@/components/download/AppDownloadQr";

/**
 * FAB fixo (canto inferior direito) — só desktop.
 * Abre modal com QR apontando para `/download`.
 */
export function AppDownloadFab() {
  const [open, setOpen] = useState(false);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    document.body.classList.toggle("app-dl-modal-open", open);
    return () => document.body.classList.remove("app-dl-modal-open");
  }, [open]);

  return (
    <div className="app-dl-fab-root" data-tutorial-id="app-download-fab">
      <button
        type="button"
        className="app-dl-fab"
        aria-label={APP_RELEASE.label}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <Icon name="download" size={22} />
      </button>

      {open ? (
        <div className="app-dl-modal" role="presentation">
          <button
            type="button"
            className="app-dl-modal-backdrop"
            aria-label="Fechar"
            onClick={() => setOpen(false)}
          />
          <div
            className="app-dl-modal-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
          >
            <div className="app-dl-modal-head">
              <h2 id={titleId}>App Android</h2>
              <button
                type="button"
                className="app-dl-modal-close"
                aria-label="Fechar"
                onClick={() => setOpen(false)}
              >
                <Icon name="close" size={18} />
              </button>
            </div>
            <p className="app-dl-modal-lead">
              Escaneie o QR com o celular para abrir a página de download do{" "}
              <strong>ACME HUB</strong> v{APP_RELEASE.version}.
            </p>
            <div className="app-dl-modal-qr">
              <AppDownloadQr size={220} />
            </div>
            <a
              href={APP_RELEASE.apkPath}
              className="btn-gold app-dl-modal-cta"
              download
            >
              <Icon name="download" size={16} />
              Baixar APK direto
            </a>
            <p className="app-dl-modal-hint">
              Ou acesse <code>{APP_RELEASE.pagePath}</code> no celular.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
