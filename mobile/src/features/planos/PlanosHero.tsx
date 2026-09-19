import { Pressable, StyleSheet, Text, View } from "react-native";
import { brand } from "../../theme/brand";

type Props = {
  subtitle: string;
  showExploreLink?: boolean;
  onExplore?: () => void;
};

/** Remover anuncios — copy alinhada ao modelo ads_free. */
export function PlanosHero({
  subtitle,
  showExploreLink = false,
  onExplore,
}: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.eyebrow}>Anúncios</Text>
      <Text style={styles.title}>Remover propaganda</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      <View style={styles.pills}>
        <View style={styles.pill}>
          <Text style={styles.pillText}>App gratuito para sempre</Text>
        </View>
        <View style={styles.pill}>
          <Text style={styles.pillText}>Pagamento só na Play</Text>
        </View>
      </View>
      {showExploreLink && onExplore ? (
        <Pressable onPress={onExplore} hitSlop={6}>
          <Text style={styles.explore}>Continuar com anúncios →</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10, marginBottom: 16 },
  eyebrow: {
    fontSize: 11,
    fontFamily: brand.fontBodySemi,
    fontWeight: "600",
    color: brand.gold200,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 26,
    fontFamily: brand.fontDisplayExtra,
    fontWeight: "800",
    color: brand.text,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: brand.fontBody,
    color: brand.textMuted,
  },
  pills: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  pill: {
    borderWidth: 1,
    borderColor: brand.border,
    borderRadius: brand.radiusSm,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "rgba(212,168,67,0.08)",
  },
  pillText: {
    fontSize: 12,
    fontFamily: brand.fontBodyMed,
    fontWeight: "500",
    color: brand.gold200,
  },
  explore: {
    marginTop: 4,
    color: brand.gold,
    fontFamily: brand.fontBodySemi,
    fontWeight: "600",
    fontSize: 14,
  },
});
