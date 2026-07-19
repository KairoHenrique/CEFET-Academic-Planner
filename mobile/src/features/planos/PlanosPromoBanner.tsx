import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import type { SitePromoPublic } from "@acme/api-contracts";
import { resolvePromoExpiresAt } from "./planos-utils";
import { brand } from "../../theme/brand";

type Props = { promo: SitePromoPublic };

const DAY_MS = 24 * 60 * 60 * 1000;

function resolveDeadlineLabel(expiresAt: string | null): string | null {
  if (!expiresAt) return null;
  const target = Date.parse(expiresAt);
  if (Number.isNaN(target)) return null;
  const daysLeft = Math.ceil((target - Date.now()) / DAY_MS);
  if (daysLeft <= 0) return null;
  if (daysLeft === 1) return "Termina hoje";
  if (daysLeft <= 7) return `Termina em ${daysLeft} dias`;
  const formatted = new Date(target).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });
  return `Válido até ${formatted}`;
}

/** Espelho F28 de `PlanosPromoBanner`. */
export function PlanosPromoBanner({ promo }: Props) {
  const deadlineLabel = useMemo(
    () => resolveDeadlineLabel(resolvePromoExpiresAt(promo)),
    [promo]
  );

  return (
    <View style={styles.wrap}>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{promo.badge ?? "Oferta"}</Text>
      </View>
      <Text style={styles.title}>{promo.headline}</Text>
      <Text style={styles.copy}>{promo.description}</Text>
      {deadlineLabel ? (
        <Text style={styles.deadline}>{deadlineLabel}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: brand.radiusMd,
    borderWidth: 1,
    borderColor: "rgba(212,168,67,0.45)",
    backgroundColor: "rgba(212,168,67,0.12)",
    padding: 14,
    gap: 6,
    marginBottom: 14,
  },
  badge: {
    alignSelf: "flex-start",
    borderRadius: brand.radiusSm,
    backgroundColor: "rgba(212,168,67,0.22)",
    borderWidth: 1,
    borderColor: "rgba(212,168,67,0.4)",
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: brand.fontBodyBold,
    fontWeight: "700",
    color: brand.gold200,
  },
  title: {
    fontSize: 15,
    fontFamily: brand.fontBodyBold,
    fontWeight: "700",
    color: brand.text,
  },
  copy: {
    fontSize: 13,
    fontFamily: brand.fontBody,
    color: brand.textSecondary,
    lineHeight: 18,
  },
  deadline: {
    marginTop: 2,
    fontSize: 12,
    fontFamily: brand.fontBodySemi,
    fontWeight: "600",
    color: brand.gold300,
  },
});
