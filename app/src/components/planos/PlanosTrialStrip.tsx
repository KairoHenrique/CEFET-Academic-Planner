import type { BillingPlanView, BillingPlansResponse } from "@/lib/types/billing-api";

interface PlanosTrialStripProps {
  plan: BillingPlanView;
  trialPolicy: BillingPlansResponse["trialPolicy"];
}

export function PlanosTrialStrip({ plan, trialPolicy }: PlanosTrialStripProps) {
  return (
    <div className="planos-trial-strip" role="note">
      <div className="planos-trial-strip-copy">
        <span className="planos-trial-strip-eyebrow">Incluído no cadastro</span>
        <h2 className="planos-trial-strip-title">{plan.shortLabel}</h2>
        <p className="planos-trial-strip-meta">{plan.durationLabel}</p>
      </div>
      <p className="planos-trial-strip-note">
        {trialPolicy.durationDays} dias grátis, <strong>uma vez por CPF</strong>.
      </p>
    </div>
  );
}
