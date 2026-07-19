import { Pressable, StyleSheet, Text, View } from "react-native";
import { brand } from "../../theme/brand";

type Props = {
  subtitle: string;
  showExploreLink?: boolean;
  onExplore?: () => void;
};

/** Espelho F28 de `PlanosHero`. */
export function PlanosHero({
  subtitle,
  showExploreLink = false,
  onExplore,
}: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.eyebrow}>Assinatura</Text>
      <Text style={styles.title}>Escolha seu plano</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      <View style={styles.pills}>
        <View style={styles.pill}>
          <Text style={styles.pillText}>7 dias grátis no cadastro</Text>
        </View>
        <View style={styles.pill}>
          <Text style={styles.pillText}>Pagamento via PIX</Text>
        </View>
      </View>
      {showExploreLink && onExplore ? (
        <Pressable onPress={onExplore} hitSlop={6}>
          <Text style={styles.explore}>Explorar o ACME com trial ativo →</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10, marginBottom: 16 },
  eyebrow: {
    fontSize: 11,
    fontFamily: brand.fontBodyBold,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: brand.gold200,
  },
  title: {
    fontSize: 26,
    fontFamily: brand.fontDisplayExtra,
    fontWeight: "800",
    color: brand.text,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: brand.fontBody,
    color: brand.textSecondary,
    lineHeight: 20,
  },
  pills: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  pill: {
    borderRadius: brand.radiusSm,
    borderWidth: 1,
    borderColor: brand.border,
    backgroundColor: "rgba(255,255,255,0.04)",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  pillText: {
    fontSize: 12,
    fontFamily: brand.fontBodySemi,
    fontWeight: "600",
    color: brand.textSecondary,
  },
  explore: {
    marginTop: 4,
    fontSize: 13,
    fontFamily: brand.fontBodySemi,
    fontWeight: "600",
    color: brand.gold200,
  },
});
