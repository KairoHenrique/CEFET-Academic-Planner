import { Icon } from "@/components/ui/Icon";

/**
 * Widget fixo (canto inferior direito) — só desktop.
 * Substituído de QR Code para botão da Play Store.
 */
export function AppDownloadFab() {
  return (
    <a
      href="https://play.google.com/store/apps/details?id=br.cefethub.acme"
      target="_blank"
      rel="noopener noreferrer"
      className="app-dl-fab-root"
      data-tutorial-id="app-download-fab"
      aria-label="Baixar app Android na Play Store"
      title="Baixe nosso app na Play Store"
    >
      <div className="app-dl-qr-card" style={{ padding: "6px 8px", alignItems: "center" }}>
        <img
          src="/google-play-badge.svg"
          alt="Disponível no Google Play"
          style={{ width: "135px", height: "auto", display: "block", borderRadius: "6px" }}
        />
      </div>
    </a>
  );
}
