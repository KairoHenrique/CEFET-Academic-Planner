"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { PlanosPageShell } from "@/components/planos/PlanosPageShell";
import { PixCopyCodeField } from "@/components/planos/pix/PixCopyCodeField";
import { PixPaymentStatusBanner } from "@/components/planos/pix/PixPaymentStatusBanner";
import { PixQrCodePanel } from "@/components/planos/pix/PixQrCodePanel";
import { useBillingPaymentWatch } from "@/hooks/useBillingPaymentWatch";
import { PERFIL_QUERY_KEY } from "@/hooks/usePerfil";
import {
  clearPendingCheckout,
  readPendingCheckout,
} from "@/lib/billing/pending-checkout-storage";
import { resolvePriceLabel } from "@/lib/billing/format-brl-cents";
import { resolvePlanLabel } from "@/lib/billing/plan-catalog";
import {
  isPaymentTerminalFailure,
  isPaymentTerminalSuccess,
} from "@/lib/billing/payments/payment-view";
import type { BillingPaymentStatusView } from "@/lib/types/billing-api";
import { useQueryClient } from "@tanstack/react-query";

function mergePaymentView(
  local: BillingPaymentStatusView | null,
  remote: BillingPaymentStatusView | undefined
): BillingPaymentStatusView | null {
  if (remote) {
    return remote;
  }

  return local;
}

export function PlanosPixScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const paymentId = searchParams.get("paymentId");
  const [localPayment, setLocalPayment] = useState<BillingPaymentStatusView | null>(
    null
  );
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const checkout = readPendingCheckout(paymentId);
    if (checkout) {
      setLocalPayment({
        id: checkout.payment.id,
        planId: checkout.payment.planId,
        planLabel: resolvePlanLabel(checkout.payment.planId),
        amountCents: checkout.payment.amountCents,
        status: checkout.payment.status,
        expiresAt: checkout.payment.expiresAt,
        qrCode: checkout.payment.qrCode,
        qrCodeBase64: checkout.payment.qrCodeBase64,
        ticketUrl: checkout.payment.ticketUrl,
      });
    }
    setReady(true);
  }, [paymentId]);

  const { data: remote } = useBillingPaymentWatch(paymentId, ready);
  const payment = useMemo(
    () => mergePaymentView(localPayment, remote?.payment),
    [localPayment, remote?.payment]
  );

  useEffect(() => {
    if (!payment) {
      return;
    }

    if (isPaymentTerminalSuccess(payment.status)) {
      clearPendingCheckout();
      void queryClient.invalidateQueries({ queryKey: PERFIL_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: ["planner", "billing"] });
      router.replace("/?pix=confirmed");
    }
  }, [payment, queryClient, router]);

  if (!ready) {
    return null;
  }

  if (!paymentId || !payment) {
    return (
      <PlanosPageShell>
        <PageHeader
          eyebrow="Assinatura"
          title="Pagamento PIX"
          subtitle="Não encontramos um checkout ativo nesta sessão."
        />
        <p className="planos-back">
          <Link href="/planos?flow=pending">← Voltar aos planos</Link>
        </p>
      </PlanosPageShell>
    );
  }

  const amountLabel = resolvePriceLabel(payment.amountCents);
  const showPixFields =
    payment.status === "pending" && !isPaymentTerminalFailure(payment.status);

  return (
    <PlanosPageShell>
      <PageHeader
        eyebrow="Assinatura"
        title="Pagamento PIX"
        subtitle="Escaneie o QR Code ou copie o código no app do banco."
      />

      <div className="planos-stack">
        <PixPaymentStatusBanner
          status={payment.status}
          expiresAt={payment.expiresAt}
        />

        {showPixFields ? (
          <section className="planos-pix-layout card" aria-labelledby="pix-checkout-title">
            <h2 id="pix-checkout-title" className="sr-only">
              Checkout PIX
            </h2>
            <PixQrCodePanel
              qrCodeBase64={payment.qrCodeBase64}
              planLabel={payment.planLabel}
              amountLabel={amountLabel}
            />
            {payment.qrCode ? <PixCopyCodeField qrCode={payment.qrCode} /> : null}
            {payment.ticketUrl ? (
              <p className="pix-ticket-link">
                <a href={payment.ticketUrl} target="_blank" rel="noopener noreferrer">
                  Abrir comprovante no gateway
                </a>
              </p>
            ) : null}
          </section>
        ) : null}

        <p className="planos-back">
          <Link href="/planos?flow=pending">← Voltar aos planos</Link>
        </p>
      </div>
    </PlanosPageShell>
  );
}
