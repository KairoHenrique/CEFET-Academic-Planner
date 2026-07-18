import { StyleSheet, Text, View } from "react-native";
import { brand } from "../theme/brand";

export const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: brand.glass,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: brand.border,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: brand.text,
  },
  cardMeta: {
    marginTop: 4,
    fontSize: 13,
    color: brand.textSecondary,
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: brand.gold,
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
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: "rgba(0,96,177,0.35)",
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: brand.gold,
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
    <View
      style={[
        cardStyles.card,
        styles.stat,
        accent ? { borderLeftColor: accent, borderLeftWidth: 3 } : null,
      ]}
    >
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
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

/** Aceita objeto da API (`{ label, zone, ... }`) ou string legada. */
export function gradeRiskLabel(
  risk: { label?: string } | string | null | undefined
): string {
  if (risk == null) return "—";
  if (typeof risk === "string") {
    const map: Record<string, string> = {
      seguro: "Seguro",
      atencao: "Atenção",
      critico: "Crítico",
      recuperacao: "Recuperação",
      reprovado: "Reprovado",
      sem_nota: "Sem nota",
      safe: "Seguro",
      warning: "Atenção",
      danger: "Crítico",
      unknown: "Sem nota",
    };
    return map[risk] ?? risk;
  }
  if (typeof risk.label === "string" && risk.label.trim()) {
    return risk.label;
  }
  return "—";
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
    color: brand.gold,
  },
  statLabel: {
    marginTop: 4,
    fontSize: 12,
    color: brand.textMuted,
    fontWeight: "600",
  },
});
