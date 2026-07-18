import { StyleSheet, View } from "react-native";
import type { DashboardStats } from "@acme/api-contracts";
import { brand } from "../../theme/brand";
import { StatCard } from "../../ui/cards";

type Props = { stats: DashboardStats };

/** Ordem F28: RG · Integralização · Disciplinas · Tarefas. */
export function StatsModule({ stats }: Props) {
  return (
    <View style={styles.grid}>
      <StatCard
        label="Rendimento Global"
        value={Number(stats.rg).toFixed(2)}
        accent={brand.gold}
      />
      <StatCard
        label="Integralização"
        value={`${stats.integralizacaoPercent}%`}
        accent={brand.blue}
      />
      <StatCard label="Disciplinas" value={stats.disciplinasCursando} />
      <StatCard label="Tarefas pendentes" value={stats.tarefasPendentes} />
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 8,
  },
});
