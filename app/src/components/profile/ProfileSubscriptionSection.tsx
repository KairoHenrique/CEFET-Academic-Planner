"use client";

import type { PerfilSubscription } from "@/lib/types/perfil-api";

interface ProfileSubscriptionSectionProps {
  subscription: PerfilSubscription;
  onNavigateAway?: () => void;
}

/** App gratuito — sem CTA de renovação/pagamento. */
export function ProfileSubscriptionSection({
  subscription,
}: ProfileSubscriptionSectionProps) {
  return (
    <section
      className="profile-modal-section profile-plan-section"
      aria-labelledby="profile-plano-title"
    >
      <h3 id="profile-plano-title" className="profile-modal-section-title">
        Acesso
      </h3>

      <div className="profile-plan-card">
        <div className="profile-plan-card-head">
          <span className="profile-plan-name">ACME HUB gratuito</span>
          <span className="profile-plan-status profile-plan-status--active">
            Liberado
          </span>
        </div>
        <p className="profile-plan-remaining">
          Todas as funções acadêmicas estão disponíveis sem assinatura.
        </p>
        {subscription.planLabel ? (
          <p className="profile-plan-expires muted">
            Conta: {subscription.planLabel}
          </p>
        ) : null}
      </div>
    </section>
  );
}
