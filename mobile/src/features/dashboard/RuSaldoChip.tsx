import { StyleSheet, Text, View } from "react-native";
import { brand } from "../../theme/brand";

type Props = {
  refeicoesDisponiveis: number | null | undefined;
};

export function RuSaldoChip({ refeicoesDisponiveis }: Props) {
  const value =
    refeicoesDisponiveis != null && Number.isFinite(refeicoesDisponiveis)
      ? String(refeicoesDisponiveis)
      : "—";

  return (
    <View style={styles.chip} accessibilityLabel={`Saldo do RU: ${value} refeições`}>
      <View style={styles.textCol}>
        <Text style={styles.label}>Saldo do RU</Text>
        <Text style={styles.hint}>refeições disponíveis</Text>
      </View>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: brand.radiusMd,
    borderWidth: 1,
    borderColor: "rgba(232,198,106,0.35)",
    backgroundColor: "rgba(232,198,106,0.1)",
  },
  textCol: { flex: 1, gap: 2 },
  label: {
    fontSize: 11,
    fontFamily: brand.fontBodyBold,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: brand.gold200,
  },
  hint: {
    fontSize: 12,
    fontFamily: brand.fontBody,
    color: brand.textSecondary,
  },
  value: {
    fontSize: 28,
    fontFamily: brand.fontBodyBold,
    fontWeight: "800",
    color: brand.text,
    minWidth: 40,
    textAlign: "right",
  },
});
