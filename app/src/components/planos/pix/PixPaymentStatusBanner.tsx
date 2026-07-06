"use client";

import { Icon } from "@/components/ui/Icon";
import { paymentStatusLabel, paymentStatusTone } from "@/lib/billing/payments/payment-status-labels";
import type { PaymentStatus } from "@/lib/billing/schema/billing-schema-catalog";

interface PixPaymentStatusBannerProps {
  status: PaymentStatus;
  expiresAt: string | null;
}

function formatExpiry(expiresAt: string | null): string {
  if (!expiresAt) {
    return "—";
  }

  return new Date(expiresAt).toLocaleString("pt-BR");
}

export function PixPaymentStatusBanner({
  status,
  expiresAt,
}: PixPaymentStatusBannerProps) {
  const tone = paymentStatusTone(status);

  if (tone === "success") {
    return (
      <div className="pix-status-banner pix-status-banner--success" role="status">
        <Icon name="check" size={18} />
        <div>
          <p className="pix-status-title">Pagamento confirmado</p>
          <p className="pix-status-body">Redirecionando para o dashboard…</p>
        </div>
      </div>
    );
  }

  if (tone === "danger") {
    return (
      <div className="pix-status-banner pix-status-banner--danger" role="alert">
        <Icon name="close" size={18} />
        <div>
          <p className="pix-status-title">{paymentStatusLabel(status)}</p>
          <p className="pix-status-body">
            Gere um novo PIX em planos para tentar novamente.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="pix-status-banner pix-status-banner--pending" role="status">
      <span className="pix-status-spinner" aria-hidden />
      <div>
        <p className="pix-status-title">Aguardando pagamento</p>
        <p className="pix-status-body">
          Abra o app do banco, escaneie o QR ou cole o código. Expira em{" "}
          {formatExpiry(expiresAt)}.
        </p>
      </div>
    </div>
  );
}
