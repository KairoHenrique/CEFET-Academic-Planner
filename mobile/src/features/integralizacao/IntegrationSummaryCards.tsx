import { StyleSheet, Text, View } from "react-native";
import type { IntegralizacaoCategoryDetail } from "@acme/api-contracts";
import { brand } from "../../theme/brand";
import { Card } from "../../ui/cards";
import { Icon } from "../../ui/Icon";
import { ProgressBar } from "../../ui/ProgressBar";
import { IntegrationDonutChart } from "./IntegrationDonutChart";

type TotalProps = {
  totalDone: number;
  totalHours: number;
  percent: number;
};

/** Espelho de `IntegrationTotalCard`. */
export function IntegrationTotalCard({
  totalDone,
  totalHours,
  percent,
}: TotalProps) {
  return (
    <Card tight style={styles.totalCard}>
      <Text style={styles.sectionTitle}>Total Integralizado</Text>
      <Text style={styles.subtitle}>Progresso da formação</Text>
      <IntegrationDonutChart
        percentage={percent}
        totalDone={totalDone}
        totalHours={totalHours}
      />
    </Card>
  );
}

type SummaryProps = {
  categories: IntegralizacaoCategoryDetail[];
};

/** Espelho de `IntegrationSummaryCard`. */
export function IntegrationSummaryCard({ categories }: SummaryProps) {
  return (
    <Card tight style={styles.summaryCard}>
      <View style={styles.headerRow}>
        <Icon name="chart" size={16} color={brand.gold} />
        <Text style={styles.sectionTitle}>Resumo por Categoria</Text>
      </View>
      <View style={styles.list}>
        {categories.map((cat) => {
          const pct =
            cat.total > 0 ? Math.round((cat.done / cat.total) * 100) : 0;
          return (
            <View key={cat.label} style={styles.item}>
              <View style={styles.labelRow}>
                <Text style={styles.catLabel}>{cat.label}</Text>
                <Text style={styles.catValue}>
                  {cat.done}h / {cat.total}h
                </Text>
              </View>
              <ProgressBar percent={pct} tone="gold" height={14} />
            </View>
          );
        })}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  totalCard: {
    marginBottom: brand.space3,
    padding: brand.space3,
  },
  summaryCard: {
    marginBottom: brand.space3,
    padding: brand.space3,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 12.5,
    fontFamily: brand.fontBodySemi,
    fontWeight: "600",
    color: brand.text,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  subtitle: {
    marginTop: 4,
    marginBottom: 14,
    fontSize: 13,
    fontFamily: brand.fontBody,
    color: brand.textMuted,
  },
  list: { gap: 14 },
  item: { gap: 8 },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  catLabel: {
    flex: 1,
    fontSize: 13,
    fontFamily: brand.fontBodySemi,
    fontWeight: "600",
    color: brand.text,
  },
  catValue: {
    fontSize: 12,
    fontFamily: brand.fontBody,
    color: brand.textMuted,
  },
});
