import { Pressable, StyleSheet, Text, View } from "react-native";
import type { BillingPlanView, PaidPlanId } from "@acme/api-contracts";
import { brand } from "../../theme/brand";

type Props = {
  plans: BillingPlanView[];
  selectedPlanId: PaidPlanId;
  onSelect: (planId: PaidPlanId) => void;
};

/**
 * Espelho F28 ≤768: todos os períodos na mesma tela
 * (`grid-template-columns: repeat(5, 1fr)` — sem scroll horizontal).
 */
export function PlanosPeriodPicker({
  plans,
  selectedPlanId,
  onSelect,
}: Props) {
  const paidPlans = plans.filter((plan) => plan.kind === "paid");

  return (
    <View style={styles.shell}>
      {paidPlans.map((plan) => {
        const active = plan.id === selectedPlanId;
        return (
          <Pressable
            key={plan.id}
            style={[
              styles.btn,
              active && styles.btnActive,
              plan.featured && !active && styles.btnFeatured,
            ]}
            onPress={() => onSelect(plan.id)}
          >
            <Text
              style={[styles.label, active && styles.labelActive]}
              numberOfLines={2}
            >
              {plan.shortLabel}
            </Text>
            <Text
              style={[styles.price, active && styles.priceActive]}
              numberOfLines={2}
            >
              {plan.priceLabel}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 2,
    padding: 4,
    borderRadius: brand.radiusLg,
    borderWidth: 1,
    borderColor: brand.border,
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  btn: {
    flex: 1,
    minWidth: 0,
    borderRadius: brand.radiusSm,
    paddingVertical: 8,
    paddingHorizontal: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  btnActive: {
    backgroundColor: "rgba(212,168,67,0.2)",
  },
  btnFeatured: {
    backgroundColor: "rgba(212,168,67,0.06)",
  },
  label: {
    fontSize: 10,
    fontFamily: brand.fontBodyBold,
    fontWeight: "700",
    color: brand.textSecondary,
    textAlign: "center",
    lineHeight: 12,
  },
  labelActive: { color: brand.gold200 },
  price: {
    fontSize: 9,
    fontFamily: brand.fontBodySemi,
    fontWeight: "600",
    color: brand.textMuted,
    textAlign: "center",
    lineHeight: 11,
  },
  priceActive: { color: brand.textSecondary },
});
