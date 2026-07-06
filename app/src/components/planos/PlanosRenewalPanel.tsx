import type { BillingAccountResponse } from "@/lib/types/billing-api";

interface PlanosRenewalPanelProps {
  account: BillingAccountResponse;
}

export function PlanosRenewalPanel({ account }: PlanosRenewalPanelProps) {
  const { subscription } = account;

  if (subscription.inGracePeriod) {
    return (
      <section
        className="planos-renewal-panel planos-renewal-panel--grace"
        aria-labelledby="planos-renewal-title"
      >
        <h2 id="planos-renewal-title" className="planos-renewal-title">
          Período de tolerância
        </h2>
        <p className="planos-renewal-body">
          Sua assinatura venceu, mas você ainda tem{" "}
          <strong>{subscription.daysRemaining} dia(s)</strong> para renovar via PIX
          sem perder o acesso. O novo período será somado ao saldo restante.
        </p>
      </section>
    );
  }

  if (
    subscription.status === "expired" ||
    subscription.status === "trial_expired"
  ) {
    return (
      <section
        className="planos-renewal-panel planos-renewal-panel--expired"
        aria-labelledby="planos-renewal-title"
      >
        <h2 id="planos-renewal-title" className="planos-renewal-title">
          Renovar assinatura
        </h2>
        <p className="planos-renewal-body">
          {subscription.renewalEligible
            ? "Escolha um plano abaixo. Se ainda houver dias no ciclo anterior, o novo período será acumulado."
            : "Seu acesso expirou. Escolha um plano abaixo para voltar a usar o ACME."}
        </p>
      </section>
    );
  }

  return null;
}
