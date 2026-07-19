import { StyleSheet, Text, View } from "react-native";
import type { DashboardIntegralizacao } from "@acme/api-contracts";
import { categoryPercent } from "../../lib/safe-text";
import { brand } from "../../theme/brand";
import { Card } from "../../ui/cards";
import { ProgressBar } from "../../ui/ProgressBar";
import { SectionHeader } from "../../ui/SectionHeader";

type Props = { integralizacao: DashboardIntegralizacao };

/** Clone de `IntegrationProgress` do site — badge %, barras ouro com glow. */
export function IntegrationModule({ integralizacao }: Props) {
  return (
    <Card tight style={{ marginBottom: brand.space4 }}>
      <SectionHeader
        title="Integralização"
        icon="chart"
        badge={`${integralizacao.percent}%`}
        badgeTone="info"
      />

      <View style={styles.overall}>
        <View style={styles.labelRow}>
          <Text style={styles.label}>Total do Currículo</Text>
          <Text style={styles.value}>
            {integralizacao.totalDone}h / {integralizacao.totalHours}h
          </Text>
        </View>
        <ProgressBar percent={integralizacao.percent} tone="gold" height={10} />
      </View>

      <View style={styles.list}>
        {integralizacao.categories.map((cat, idx) => {
          const pct = categoryPercent(cat.done, cat.total);
          return (
            <View key={`${cat.label}-${idx}`} style={styles.item}>
              <View style={styles.labelRow}>
                <Text style={styles.catLabel}>{cat.label}</Text>
                <Text style={styles.catValue}>
                  {cat.pending > 0
                    ? `${cat.pending}h pendentes`
                    : `${cat.done}h / ${cat.total}h`}
                </Text>
              </View>
              <ProgressBar percent={pct} tone="gold" height={8} />
            </View>
          );
        })}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  overall: {
    marginBottom: brand.space5,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: brand.space2,
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontFamily: brand.fontBodyMed,
    fontWeight: "500",
    color: brand.textSecondary,
  },
  value: {
    fontSize: 13,
    fontFamily: brand.fontBodySemi,
    fontWeight: "600",
    color: brand.text,
  },
  list: {
    gap: brand.space4,
  },
  item: {},
  catLabel: {
    fontSize: 12,
    fontFamily: brand.fontBodyMed,
    fontWeight: "500",
    color: brand.textSecondary,
    flex: 1,
  },
  catValue: {
    fontSize: 12,
    fontFamily: brand.fontBodySemi,
    fontWeight: "600",
    color: brand.text,
  },
});
