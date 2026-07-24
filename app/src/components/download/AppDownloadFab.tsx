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
      <div className="app-dl-qr-card" style={{ padding: "12px", alignItems: "center", gap: "8px" }}>
        <Icon name="smartphone" size={36} />
        <span className="app-dl-qr-card-label" style={{ marginTop: "4px" }}>Disponível no<br/>Google Play</span>
      </div>
    </a>
  );
}
