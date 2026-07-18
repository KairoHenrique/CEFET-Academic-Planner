import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { brand } from "../theme/brand";

type Props = {
  label?: string;
};

export function LoadingBlock({ label = "Carregando…" }: Props) {
  return (
    <View style={styles.root}>
      <ActivityIndicator color={brand.gold} size="large" />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    paddingVertical: 32,
    alignItems: "center",
    gap: 12,
  },
  label: {
    color: brand.textMuted,
    fontSize: 14,
  },
});
