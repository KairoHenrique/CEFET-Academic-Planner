"use client";

import Link from "next/link";
import type { PerfilSubscription } from "@/lib/types/perfil-api";
import { formatDateTime, formatRemainingDays } from "@/lib/perfil/format-profile-value";

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
}

export function ProfileSubscriptionSection({
  subscription,
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
    </section>
  );
}
