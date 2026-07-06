"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";

interface PixCopyCodeFieldProps {
  qrCode: string;
}

export function PixCopyCodeField({ qrCode }: PixCopyCodeFieldProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(qrCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="pix-copy-field">
      <label htmlFor="pix-copy-code" className="pix-copy-label">
        PIX copia e cola
      </label>
      <div className="pix-copy-row">
        <textarea
          id="pix-copy-code"
          className="pix-copy-input"
          readOnly
          rows={3}
          value={qrCode}
          aria-label="Código PIX copia e cola"
        />
        <button
          type="button"
          className="btn-outline pix-copy-btn"
          onClick={() => void handleCopy()}
        >
          <Icon name="clipboard" size={16} />
          {copied ? "Copiado!" : "Copiar"}
        </button>
      </div>
    </div>
  );
}
