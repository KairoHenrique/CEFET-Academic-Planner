import { StyleSheet, View } from "react-native";
import type { DashboardStats } from "@acme/api-contracts";
import { brand } from "../../theme/brand";
import { StatCard } from "../../ui/cards";

type Props = { stats: DashboardStats };

/** Ordem e copy F28 StatsRow. */
export function StatsModule({ stats }: Props) {
  return (
    <View style={styles.grid}>
      <StatCard
        label="Rendimento Global"
        value={Number(stats.rg).toFixed(2)}
        detail="RG acumulado"
        tone="gold"
      />
      <StatCard
        label="Integralização"
        value={`${stats.integralizacaoPercent}%`}
        detail="do curso concluído"
        tone="blue"
      />
      <StatCard
        label="Disciplinas"
        value={stats.disciplinasCursando}
        detail="cursando este semestre"
        tone="blue"
      />
      <StatCard
        label="Tarefas Pendentes"
        value={stats.tarefasPendentes}
        detail="entregas próximas"
        tone="danger"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: brand.space3,
    marginBottom: brand.space2,
  },
});
