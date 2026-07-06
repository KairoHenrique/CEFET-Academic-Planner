"use client";

import Link from "next/link";
import type { PerfilSubscription } from "@/lib/types/perfil-api";
import type { BillingPaymentHistoryItem } from "@/lib/types/billing-api";
import { formatDateTime, formatRemainingDays } from "@/lib/perfil/format-profile-value";
import { paymentStatusLabel, paymentStatusTone } from "@/lib/billing/payments/payment-status-labels";
import { resolvePriceLabel } from "@/lib/billing/format-brl-cents";

function subscriptionStatusLabel(
  status: PerfilSubscription["status"]
): string {
  const labels: Record<PerfilSubscription["status"], string> = {
    trial_active: "Trial ativo",
    trial_expired: "Trial expirado",
    pending_payment: "Aguardando pagamento",
    active: "Assinatura ativa",
    expired: "Assinatura expirada",
    cancelled: "Assinatura cancelada",
  };
  return labels[status];
}

interface ProfileSubscriptionSectionProps {
  subscription: PerfilSubscription;
  payments: BillingPaymentHistoryItem[];
  paymentsLoading?: boolean;
}

export function ProfileSubscriptionSection({
  subscription,
  payments,
  paymentsLoading = false,
}: ProfileSubscriptionSectionProps) {
  return (
    <section
      className="profile-modal-section profile-plan-section"
      aria-labelledby="profile-plano-title"
    >
      <h3 id="profile-plano-title" className="profile-modal-section-title">
        Minha assinatura
      </h3>

      <div className="profile-plan-card">
        <div className="profile-plan-card-head">
          <span className="profile-plan-name">{subscription.planLabel}</span>
          <span
            className={`profile-plan-status profile-plan-status--${subscription.status}`}
          >
            {subscriptionStatusLabel(subscription.status)}
          </span>
        </div>

        {subscription.inGracePeriod ? (
          <p className="profile-plan-grace" role="note">
            Período de tolerância — renove em {subscription.daysRemaining} dia(s).
          </p>
        ) : null}

        <p className="profile-plan-remaining">
          {formatRemainingDays(subscription.daysRemaining)}
        </p>
        <p className="profile-plan-expires">
          Válido até{" "}
          {formatDateTime(subscription.expiresAt).split(",")[0] ?? "—"}
        </p>
        <Link href={subscription.renewHref} className="btn-gold btn-sm profile-plan-renew">
          Renovar ou assinar plano
        </Link>
      </div>

      <div className="profile-payment-history">
        <h4 className="profile-payment-history-title">Histórico de pagamentos</h4>
        {paymentsLoading ? (
          <p className="profile-payment-history-empty">Carregando histórico…</p>
        ) : payments.length === 0 ? (
          <p className="profile-payment-history-empty">
            Nenhum pagamento PIX registrado ainda.
          </p>
        ) : (
          <ul className="profile-payment-history-list">
            {payments.map((payment) => (
              <li key={payment.id} className="profile-payment-history-item">
                <div className="profile-payment-history-main">
                  <span className="profile-payment-history-plan">
                    {payment.planLabel}
                  </span>
                  <span className="profile-payment-history-amount">
                    {resolvePriceLabel(payment.amountCents)}
                  </span>
                </div>
                <div className="profile-payment-history-meta">
                  <span
                    className={`profile-payment-status profile-payment-status--${paymentStatusTone(payment.status)}`}
                  >
                    {paymentStatusLabel(payment.status)}
                  </span>
                  <span>{formatDateTime(payment.createdAt)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
