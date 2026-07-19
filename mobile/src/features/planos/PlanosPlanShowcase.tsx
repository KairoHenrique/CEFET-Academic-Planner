import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import type {
  BillingPlansResponse,
  BillingPlanView,
  PaidPlanId,
} from "@acme/api-contracts";
import { formatBrlCents, resolvePlanSavingsLabel } from "./planos-utils";
import { brand } from "../../theme/brand";

type Props = {
  plan: BillingPlanView;
  catalog: BillingPlansResponse;
  selectingPlanId: PaidPlanId | null;
  onCheckout: (planId: PaidPlanId) => void;
};

/** Espelho F28 de `PlanosPlanShowcase`. */
export function PlanosPlanShowcase({
  plan,
  catalog,
  selectingPlanId,
  onCheckout,
}: Props) {
  const isSelecting = selectingPlanId === plan.id;
  const savings =
    plan.kind === "paid" ? resolvePlanSavingsLabel(catalog, plan.id) : null;
  const checkoutDisabled = !catalog.checkoutEnabled || Boolean(selectingPlanId);
  const isPromoPlan =
    plan.kind === "paid" && catalog.promo?.highlightPlanId === plan.id;
  const cta = plan.ctaLabel ?? "Assinar via PIX";

  return (
    <View
      style={[
        styles.card,
        plan.featured && styles.featured,
        isPromoPlan && styles.promo,
      ]}
    >
      {isPromoPlan ? (
        <View style={[styles.badge, styles.badgePromo]}>
          <Text style={styles.badgeText}>
            {catalog.promo?.badge ?? "Promoção"}
          </Text>
        </View>
      ) : plan.featured ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Recomendado</Text>
        </View>
      ) : null}

      <Text style={styles.duration}>{plan.durationLabel}</Text>
      <Text style={styles.title}>{plan.shortLabel}</Text>

      {isPromoPlan && catalog.promo?.basePriceCents != null ? (
        <Text style={styles.basePrice}>
          {formatBrlCents(catalog.promo.basePriceCents)}
        </Text>
      ) : null}

      <Text style={styles.price}>{plan.priceLabel}</Text>
      {savings ? <Text style={styles.savings}>{savings}</Text> : null}
      <Text style={styles.copy}>{plan.description}</Text>

      <Pressable
        style={[styles.cta, checkoutDisabled && styles.disabled]}
        disabled={checkoutDisabled}
        onPress={() => onCheckout(plan.id)}
      >
        {isSelecting ? (
          <ActivityIndicator color="#1a1408" />
        ) : (
          <Text style={styles.ctaText}>
            {catalog.checkoutEnabled ? cta : `${cta} (em breve)`}
          </Text>
        )}
      </Pressable>

      <Text style={styles.footnote}>
        Confirmação automática após o pagamento PIX.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 12,
    borderRadius: brand.radiusLg,
    borderWidth: 1,
    borderColor: brand.border,
    backgroundColor: brand.bgElevated,
    padding: 16,
    gap: 6,
  },
  featured: {
    borderColor: "rgba(212,168,67,0.5)",
  },
  promo: {
    borderColor: "rgba(212,168,67,0.65)",
    backgroundColor: "rgba(212,168,67,0.06)",
  },
  badge: {
    alignSelf: "flex-start",
    borderRadius: brand.radiusSm,
    backgroundColor: "rgba(212,168,67,0.16)",
    borderWidth: 1,
    borderColor: "rgba(212,168,67,0.35)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 4,
  },
  badgePromo: {
    backgroundColor: "rgba(248,81,73,0.16)",
    borderColor: "rgba(248,81,73,0.4)",
  },
  badgeText: {
    fontSize: 10,
    fontFamily: brand.fontBodyBold,
    fontWeight: "700",
    color: brand.gold200,
    textTransform: "uppercase",
  },
  duration: {
    fontSize: 12,
    fontFamily: brand.fontBody,
    color: brand.textMuted,
  },
  title: {
    fontSize: 22,
    fontFamily: brand.fontDisplayExtra,
    fontWeight: "800",
    color: brand.text,
  },
  basePrice: {
    fontSize: 14,
    fontFamily: brand.fontBody,
    color: brand.textMuted,
    textDecorationLine: "line-through",
  },
  price: {
    fontSize: 28,
    fontFamily: brand.fontDisplayExtra,
    fontWeight: "800",
    color: brand.gold,
  },
  savings: {
    fontSize: 13,
    fontFamily: brand.fontBodySemi,
    fontWeight: "600",
    color: "#3FB950",
  },
  copy: {
    marginTop: 4,
    fontSize: 13,
    fontFamily: brand.fontBody,
    color: brand.textSecondary,
    lineHeight: 19,
  },
  cta: {
    marginTop: 12,
    minHeight: 48,
    borderRadius: brand.radiusMd,
    backgroundColor: brand.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaText: {
    fontSize: 15,
    fontFamily: brand.fontBodyBold,
    fontWeight: "700",
    color: "#1a1408",
  },
  footnote: {
    marginTop: 4,
    fontSize: 11,
    fontFamily: brand.fontBody,
    color: brand.textMuted,
    textAlign: "center",
  },
  disabled: { opacity: 0.5 },
});
