"use client";

import { useEffect, useMemo, useState } from "react";
import { PlanosPeriodPicker } from "@/components/planos/PlanosPeriodPicker";
import { PlanosPlanShowcase } from "@/components/planos/PlanosPlanShowcase";
import {
  resolveDefaultPaidPlanId,
} from "@/components/planos/planos-plan-utils";
import type { BillingPlansResponse, PaidPlanId } from "@/lib/types/billing-api";

interface PlanosCheckoutPanelProps {
  catalog: BillingPlansResponse;
  selectingPlanId: PaidPlanId | null;
  onCheckout: (planId: PaidPlanId) => void;
}

export function PlanosCheckoutPanel({
  catalog,
  selectingPlanId,
  onCheckout,
}: PlanosCheckoutPanelProps) {
  const defaultPlanId = useMemo(
    () => resolveDefaultPaidPlanId(catalog),
    [catalog]
  );
  const [selectedPlanId, setSelectedPlanId] = useState<PaidPlanId>(defaultPlanId);

  useEffect(() => {
    setSelectedPlanId(defaultPlanId);
  }, [defaultPlanId]);

  const selectedPlan = catalog.plans.find(
    (plan) => plan.kind === "paid" && plan.id === selectedPlanId
  );

  if (!selectedPlan || selectedPlan.kind !== "paid") {
    return null;
  }

  return (
    <section
      className="planos-checkout"
      aria-label="Checkout de planos"
      data-tutorial-id="tutorial-planos-checkout"
    >
      <PlanosPeriodPicker
        plans={catalog.plans}
        selectedPlanId={selectedPlanId}
        onSelect={setSelectedPlanId}
      />
      <PlanosPlanShowcase
        plan={selectedPlan}
        catalog={catalog}
        selectingPlanId={selectingPlanId}
        onCheckout={onCheckout}
      />
    </section>
  );
}
