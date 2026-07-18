import { StyleSheet, Text, View } from "react-native";
import type { DashboardIntegralizacao } from "@acme/api-contracts";
import { categoryPercent } from "../../lib/safe-text";
import { brand } from "../../theme/brand";
import { cardStyles } from "../../ui/cards";

type Props = { integralizacao: DashboardIntegralizacao };

export function IntegrationModule({ integralizacao }: Props) {
  return (
    <>
      <Text style={cardStyles.sectionTitle}>Integralização</Text>
      <View style={cardStyles.card}>
        <Text style={cardStyles.cardTitle}>
          {integralizacao.totalDone}h / {integralizacao.totalHours}h ·{" "}
          {integralizacao.percent}%
        </Text>
        <View style={styles.barTrack}>
          <View
            style={[
              styles.barFill,
              { width: `${Math.min(100, integralizacao.percent)}%` },
            ]}
          />
        </View>
        {integralizacao.categories.map((cat, idx) => {
          const pct = categoryPercent(cat.done, cat.total);
          return (
            <View key={`${cat.label}-${idx}`} style={styles.barBlock}>
              <View style={cardStyles.row}>
                <Text style={styles.catLabel}>{cat.label}</Text>
                <Text style={styles.catPct}>{pct}%</Text>
              </View>
              <View style={styles.barTrackSm}>
                <View style={[styles.barFill, { width: `${Math.min(100, pct)}%` }]} />
              </View>
              <Text style={cardStyles.cardMeta}>
                {cat.pending > 0
                  ? `${cat.pending}h pendentes`
                  : `${cat.done}h / ${cat.total}h`}
              </Text>
            </View>
          );
        })}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  barBlock: { marginTop: 12 },
  catLabel: {
    color: brand.text,
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
  },
  catPct: {
    color: brand.gold,
    fontWeight: "800",
    fontSize: 13,
  },
  barTrack: {
    marginTop: 8,
    height: 10,
    borderRadius: 5,
    backgroundColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
  },
  barTrackSm: {
    marginTop: 6,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    backgroundColor: brand.gold400,
    borderRadius: 4,
  },
});
