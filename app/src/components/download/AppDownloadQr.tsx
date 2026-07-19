"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { APP_RELEASE } from "@/config/app-download";

type Props = {
  /** Absolute URL encoded in the QR (defaults to APK download URL). */
  url?: string;
  size?: number;
  className?: string;
};

/** QR client-side (widget desktop / página /download). */
export function AppDownloadQr({ url, size = 220, className }: Props) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const target = url ?? APP_RELEASE.apkPath;

    void QRCode.toDataURL(target, {
      width: size,
      margin: 2,
      color: { dark: "#0a1628", light: "#ffffff" },
      errorCorrectionLevel: "M",
    })
      .then((value) => {
        if (!cancelled) {
          setDataUrl(value);
          setError(null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError("Não foi possível gerar o QR.");
          setDataUrl(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [url, size]);

  if (error) {
    return <p className="app-dl-qr-error">{error}</p>;
  }

  if (!dataUrl) {
    return <div className={`app-dl-qr-skeleton ${className ?? ""}`} aria-hidden />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={dataUrl}
      width={size}
      height={size}
      alt={`QR Code para baixar o ${APP_RELEASE.label}`}
      className={className}
    />
  );
}
