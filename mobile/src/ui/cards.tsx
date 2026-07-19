import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { brand } from "../theme/brand";
import { Icon, type IconName } from "./Icon";

export { gradeRiskLabel } from "../lib/safe-text";

/** Card F28 — glass + hairline + sombra do site. */
export function Card({
  children,
  style,
  compact,
  tight,
}: {
  children: ReactNode;
  style?: object;
  compact?: boolean;
  tight?: boolean;
}) {
  return (
    <View
      style={[
        styles.card,
        compact && styles.cardCompact,
        tight && styles.cardTight,
        style,
      ]}
    >
      <LinearGradient
        colors={[
          "rgba(232,198,106,0)",
          "rgba(232,198,106,0.55)",
          "rgba(232,198,106,0)",
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.hairline, tight && styles.hairlineTight]}
        pointerEvents="none"
      />
      {children}
    </View>
  );
}

export const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: brand.bgSecondary,
    borderRadius: brand.radiusLg,
    padding: 12,
    marginBottom: brand.space4,
    borderWidth: 1,
    borderColor: brand.border,
    overflow: "hidden",
  },
  cardTitle: {
    fontSize: 14,
    fontFamily: brand.fontBodyMed,
    fontWeight: "500",
    color: brand.text,
  },
  cardMeta: {
    marginTop: 2,
    fontSize: 12,
    fontFamily: brand.fontBody,
    color: brand.textSecondary,
    lineHeight: 16,
  },
  /** Preferir `SectionHeader` — mantido p/ telas legadas */
  sectionTitle: {
    fontSize: 14,
    fontFamily: brand.fontBodySemi,
    fontWeight: "600",
    color: brand.text,
    textTransform: "uppercase",
    letterSpacing: 0.84,
    marginBottom: brand.space4,
    marginTop: brand.space2,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  badge: {
    borderRadius: brand.radiusSm,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: "rgba(212,168,67,0.16)",
    borderWidth: 1,
    borderColor: brand.borderEmphasis,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: brand.fontBodyBold,
    fontWeight: "700",
    color: brand.gold200,
  },
});

/** Header de página F28 — eyebrow + título + highlight + subtitle. */
export function PageHeader({
  eyebrow,
  title,
  highlight,
  subtitle,
  cacheHint,
}: {
  eyebrow?: string;
  title: string;
  highlight?: string;
  subtitle?: string;
  cacheHint?: string | null;
}) {
  return (
    <View style={pageStyles.wrap}>
      {eyebrow ? <Text style={pageStyles.eyebrow}>{eyebrow}</Text> : null}
      <Text style={pageStyles.title}>
        {title}
        {highlight ? (
          <Text style={pageStyles.highlight}> {highlight}</Text>
        ) : null}
      </Text>
      {subtitle ? <Text style={pageStyles.subtitle}>{subtitle}</Text> : null}
      {cacheHint ? <Text style={pageStyles.cache}>{cacheHint}</Text> : null}
    </View>
  );
}

/** Stat card F28 — label UPPER + valor Outfit grande + detail + ícone do site. */
export function StatCard({
  label,
  value,
  detail,
  tone = "gold",
  icon = "star",
}: {
  label: string;
  value: string | number;
  detail?: string;
  tone?: "gold" | "blue" | "danger" | "success";
  icon?: IconName;
}) {
  const valueColor =
    tone === "blue"
      ? brand.jerseyLight
      : tone === "danger"
        ? brand.danger
        : tone === "success"
          ? brand.success
          : brand.gold;

  return (
    <Card style={statStyles.card} tight>
      <Text style={statStyles.label}>{label}</Text>
      <View style={statStyles.row}>
        <View style={{ flex: 1 }}>
          <Text style={[statStyles.value, { color: valueColor }]}>{value}</Text>
          {detail ? <Text style={statStyles.detail}>{detail}</Text> : null}
        </View>
        <View style={statStyles.icon}>
          <Icon name={icon} size={18} color={brand.gold} />
        </View>
      </View>
    </Card>
  );
}

export function formatPtDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso.includes("T") ? iso : `${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });
}

export function formatGrade(value: number | null, max = 10): string {
  if (value == null) return "—";
  return `${value.toFixed(1)}/${max}`;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: brand.bgSecondary,
    borderRadius: brand.radiusLg,
    padding: brand.space6,
    marginBottom: brand.space4,
    borderWidth: 1,
    borderColor: brand.border,
    overflow: "hidden",
    position: "relative",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  cardCompact: {
    padding: brand.space5,
  },
  cardTight: {
    padding: 12,
  },
  hairline: {
    position: "absolute",
    top: 0,
    left: brand.space6,
    right: brand.space6,
    height: 1,
    opacity: 0.7,
  },
  hairlineTight: {
    left: 12,
    right: 12,
  },
});

const pageStyles = StyleSheet.create({
  wrap: {
    marginBottom: brand.space4,
    paddingBottom: brand.space3,
    borderBottomWidth: 1,
    borderBottomColor: brand.border,
  },
  eyebrow: {
    fontSize: 12,
    fontFamily: brand.fontBodyBold,
    fontWeight: "700",
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: brand.gold,
    marginBottom: brand.space2,
  },
  title: {
    fontSize: 26,
    fontFamily: brand.fontDisplayExtra,
    fontWeight: "800",
    color: brand.text,
    letterSpacing: -0.5,
  },
  highlight: {
    color: brand.gold200,
  },
  subtitle: {
    marginTop: brand.space2,
    fontSize: 15,
    fontFamily: brand.fontBody,
    color: brand.textSecondary,
    lineHeight: 21,
  },
  cache: {
    marginTop: 6,
    fontSize: 12,
    fontFamily: brand.fontBodySemi,
    color: brand.gold,
    fontWeight: "600",
  },
});

const statStyles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: "47%",
    marginBottom: 0,
  },
  label: {
    fontSize: 11,
    fontFamily: brand.fontBodySemi,
    fontWeight: "600",
    color: brand.text,
    textTransform: "uppercase",
    letterSpacing: 0.7,
    marginBottom: brand.space3,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: brand.space3,
  },
  value: {
    fontSize: 34,
    fontFamily: brand.fontDisplayExtra,
    fontWeight: "800",
    lineHeight: 36,
    letterSpacing: -0.8,
  },
  detail: {
    marginTop: brand.space2,
    fontSize: 13,
    fontFamily: brand.fontBody,
    color: brand.textSecondary,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: brand.radiusSm,
    backgroundColor: "rgba(212,168,67,0.14)",
    borderWidth: 1,
    borderColor: brand.borderEmphasis,
    alignItems: "center",
    justifyContent: "center",
  },
});
