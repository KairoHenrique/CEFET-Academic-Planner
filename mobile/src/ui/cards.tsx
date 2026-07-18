import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { brand } from "../theme/brand";

export { gradeRiskLabel } from "../lib/safe-text";

/** Card F28 — `.card` + hairline dourado superior. */
export function Card({
  children,
  style,
  compact,
}: {
  children: ReactNode;
  style?: object;
  compact?: boolean;
}) {
  return (
    <View style={[styles.card, compact && styles.cardCompact, style]}>
      <View style={styles.hairline} />
      {children}
    </View>
  );
}

export const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: brand.bgSecondary,
    borderRadius: brand.radiusLg,
    padding: brand.space4,
    marginBottom: brand.space3,
    borderWidth: 1,
    borderColor: brand.border,
    overflow: "hidden",
  },
  cardTitle: {
    fontSize: 15,
    fontFamily: brand.fontBodyBold,
    fontWeight: "700",
    color: brand.text,
  },
  cardMeta: {
    marginTop: 4,
    fontSize: 12,
    fontFamily: brand.fontBody,
    color: brand.textMuted,
    lineHeight: 17,
  },
  /** `.section-header-title` F28 */
  sectionTitle: {
    fontSize: 14,
    fontFamily: brand.fontBodySemi,
    fontWeight: "600",
    color: brand.text,
    textTransform: "uppercase",
    letterSpacing: 0.9,
    marginBottom: brand.space3,
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
    paddingHorizontal: 12,
    paddingVertical: 3,
    backgroundColor: "rgba(212,168,67,0.16)",
    borderWidth: 1,
    borderColor: brand.borderEmphasis,
  },
  badgeText: {
    fontSize: 11,
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

/** Stat card F28 — label UPPER + valor Outfit grande + detail. */
export function StatCard({
  label,
  value,
  detail,
  tone = "gold",
}: {
  label: string;
  value: string | number;
  detail?: string;
  tone?: "gold" | "blue" | "danger" | "success";
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
    <Card style={statStyles.card} compact>
      <Text style={statStyles.label}>{label}</Text>
      <View style={statStyles.row}>
        <View style={{ flex: 1 }}>
          <Text style={[statStyles.value, { color: valueColor }]}>{value}</Text>
          {detail ? <Text style={statStyles.detail}>{detail}</Text> : null}
        </View>
        <View style={statStyles.icon}>
          <Text style={statStyles.iconText}>◆</Text>
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
    padding: brand.space5,
    marginBottom: brand.space3,
    borderWidth: 1,
    borderColor: brand.border,
    overflow: "hidden",
    position: "relative",
  },
  cardCompact: {
    padding: brand.space4,
  },
  hairline: {
    position: "absolute",
    top: 0,
    left: brand.space4,
    right: brand.space4,
    height: 1,
    backgroundColor: "rgba(232,198,106,0.45)",
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
  iconText: {
    color: brand.gold,
    fontSize: 12,
  },
});
