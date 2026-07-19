import { useEffect, useMemo, useState } from "react";
import { View } from "react-native";
import type { BillingPlansResponse, PaidPlanId } from "@acme/api-contracts";
import { PlanosPeriodPicker } from "./PlanosPeriodPicker";
import { PlanosPlanShowcase } from "./PlanosPlanShowcase";
import { resolveDefaultPaidPlanId } from "./planos-utils";

type Props = {
  catalog: BillingPlansResponse;
  selectingPlanId: PaidPlanId | null;
  onCheckout: (planId: PaidPlanId) => void;
};

export function PlanosCheckoutPanel({
  catalog,
  selectingPlanId,
  onCheckout,
}: Props) {
  const defaultPlanId = useMemo(
    () => resolveDefaultPaidPlanId(catalog),
    [catalog]
  );
  const [selectedPlanId, setSelectedPlanId] =
    useState<PaidPlanId>(defaultPlanId);

  useEffect(() => {
    setSelectedPlanId(defaultPlanId);
  }, [defaultPlanId]);

  const selectedPlan = catalog.plans.find(
    (plan) => plan.kind === "paid" && plan.id === selectedPlanId
  );

  if (!selectedPlan || selectedPlan.kind !== "paid") return null;

  return (
    <View>
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
    </View>
  );
}
