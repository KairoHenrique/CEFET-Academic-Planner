import { StyleSheet, Text, View } from "react-native";
import { brand } from "../theme/brand";

export const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: brand.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(0,96,177,0.1)",
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: brand.navy,
  },
  cardMeta: {
    marginTop: 4,
    fontSize: 13,
    color: brand.muted,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: brand.navy,
    marginBottom: 10,
    marginTop: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: "rgba(0,96,177,0.1)",
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: brand.blue,
  },
});

export function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent?: string;
}) {
  return (
    <View style={[cardStyles.card, styles.stat, accent ? { borderLeftColor: accent, borderLeftWidth: 4 } : null]}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export function formatPtDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
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
  stat: {
    flex: 1,
    minWidth: "45%",
    marginBottom: 0,
  },
  statValue: {
    fontSize: 22,
    fontWeight: "800",
    color: brand.blue,
  },
  statLabel: {
    marginTop: 4,
    fontSize: 12,
    color: brand.muted,
    fontWeight: "600",
  },
});
