import { Pressable, StyleSheet, Text, View } from "react-native";
import { brand } from "../../theme/brand";

type Props = { onGoToLogin: () => void };

export function RegisterAccountExistsNotice({ onGoToLogin }: Props) {
  return (
    <View style={styles.wrap} accessibilityRole="alert">
      <Text style={styles.title}>Este CPF já possui conta</Text>
      <Text style={styles.body}>
        O trial gratuito é válido uma vez por CPF. Entre com sua senha do SIGAA
        para escolher ou renovar um plano.
      </Text>
      <Pressable style={styles.btn} onPress={onGoToLogin}>
        <Text style={styles.btnText}>Ir para login</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 8,
    borderRadius: brand.radiusMd,
    borderWidth: 1,
    borderColor: "rgba(212,168,67,0.4)",
    backgroundColor: "rgba(212,168,67,0.1)",
    padding: 14,
  },
  title: {
    fontSize: 15,
    fontFamily: brand.fontBodyBold,
    fontWeight: "700",
    color: brand.text,
  },
  body: {
    fontSize: 13,
    fontFamily: brand.fontBody,
    color: brand.textSecondary,
    lineHeight: 18,
  },
  btn: {
    marginTop: 4,
    minHeight: 44,
    borderRadius: brand.radiusMd,
    backgroundColor: brand.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  btnText: {
    fontSize: 14,
    fontFamily: brand.fontBodyBold,
    fontWeight: "700",
    color: "#1a1408",
  },
});
