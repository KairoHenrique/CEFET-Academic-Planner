import type { BillingAccountResponse } from "@/lib/types/billing-api";
import type { PlanosFlow } from "@/lib/billing/subscription-access-client";

interface PlanosStatusAlertProps {
  flow: PlanosFlow | null;
  account: BillingAccountResponse | undefined;
}

const FLOW_COPY: Record<
  Exclude<PlanosFlow, "exists">,
  { title: string; body: string; tone: "welcome" | "renew" | "pending" }
> = {
  welcome: {
    tone: "welcome",
    title: "Conta criada",
    body: "Seu trial de 7 dias já está ativo. Assine quando quiser garantir acesso contínuo.",
  },
  renew: {
    tone: "renew",
    title: "Assinatura necessária",
    body: "Escolha um período abaixo e pague via PIX para voltar ao ACME.",
  },
  pending: {
    tone: "pending",
    title: "PIX pendente",
    body: "Conclua o pagamento em andamento ou escolha um novo plano.",
  },
};

export function PlanosStatusAlert({ flow, account }: PlanosStatusAlertProps) {
  if (flow && flow !== "exists") {
    const copy = FLOW_COPY[flow];
    return (
      <div
        className={`planos-alert planos-alert--${copy.tone}`}
        role="status"
        aria-live="polite"
      >
        <strong>{copy.title}</strong>
        <span>{copy.body}</span>
      </div>
    );
  }

  const subscription = account?.subscription;
  if (!subscription) {
    return null;
  }

  if (subscription.inGracePeriod) {
    return (
      <div className="planos-alert planos-alert--grace" role="status">
        <strong>Período de tolerância</strong>
        <span>
          Você ainda tem {subscription.daysRemaining} dia(s) para renovar. O novo
          período será somado ao saldo restante.
        </span>
      </div>
    );
  }

  if (
    subscription.status === "expired" ||
    subscription.status === "trial_expired"
  ) {
    return (
      <div className="planos-alert planos-alert--renew" role="status">
        <strong>Renovar assinatura</strong>
        <span>
          {subscription.renewalEligible
            ? "Dias restantes do ciclo anterior serão acumulados ao renovar."
            : "Seu acesso expirou. Escolha um plano para continuar."}
        </span>
      </div>
    );
  }

  return null;
}
