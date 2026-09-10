import { StyleSheet, Text, View } from "react-native";
import { brand } from "../../theme/brand";
import { Icon } from "../../ui/Icon";

/** App gratuito — sem trial/assinatura. */
export function AuthTrialBanner() {
  return (
    <View style={styles.wrap}>
      <View style={styles.icon}>
        <Icon name="star" size={15} color={brand.gold} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.eyebrow}>100% gratuito</Text>
        <Text style={styles.title}>
          Sem assinatura — acesso completo ao criar a conta
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: brand.radiusMd,
    borderWidth: 1,
    borderColor: "rgba(212,168,67,0.4)",
    backgroundColor: "rgba(212,168,67,0.12)",
    padding: 12,
  },
  icon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(212,168,67,0.18)",
  },
  copy: { flex: 1, gap: 2 },
  eyebrow: {
    fontSize: 11,
    fontFamily: brand.fontBodyBold,
    fontWeight: "700",
    color: brand.gold200,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  title: {
    fontSize: 14,
    fontFamily: brand.fontBodySemi,
    fontWeight: "600",
    color: brand.text,
  },
});
