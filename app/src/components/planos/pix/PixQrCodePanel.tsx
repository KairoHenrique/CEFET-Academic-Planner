interface PixQrCodePanelProps {
  qrCodeBase64: string | null;
  planLabel: string;
  amountLabel: string;
}

function resolveQrImageSrc(qrCodeBase64: string | null): string | null {
  if (!qrCodeBase64?.trim()) {
    return null;
  }

  const value = qrCodeBase64.trim();
  if (value.startsWith("data:")) {
    return value;
  }

  return `data:image/png;base64,${value}`;
}

export function PixQrCodePanel({
  qrCodeBase64,
  planLabel,
  amountLabel,
}: PixQrCodePanelProps) {
  const imageSrc = resolveQrImageSrc(qrCodeBase64);

  return (
    <div className="pix-qr-panel">
      <div className="pix-qr-frame" aria-hidden={!imageSrc}>
        {imageSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageSrc}
            alt={`QR Code PIX — ${planLabel}`}
            className="pix-qr-image"
            width={240}
            height={240}
          />
        ) : (
          <div className="pix-qr-placeholder">
            <span>QR indisponível</span>
            <span className="pix-qr-placeholder-hint">
              Use o código copia e cola abaixo.
            </span>
          </div>
        )}
      </div>
      <div className="pix-qr-meta">
        <p className="pix-qr-plan">{planLabel}</p>
        <p className="pix-qr-amount">{amountLabel}</p>
      </div>
    </div>
  );
}
