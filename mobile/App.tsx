import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";
import { brand } from "./src/theme/brand";

/**
 * M1 — scaffold Expo (Android only).
 * Telas, auth, cache e push entram em M2+.
 */
export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.brand}>ACME HUB</Text>
      <Text style={styles.subtitle}>Mobile Android · Bloco 8</Text>
      <Text style={styles.hint}>
        Expo Go · bottom tabs (sem sidebar) · M1 ok
      </Text>
      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: brand.blue,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  brand: {
    color: brand.white,
    fontSize: 36,
    fontWeight: "800",
    letterSpacing: 1,
  },
  subtitle: {
    marginTop: 8,
    color: brand.gold,
    fontSize: 16,
    fontWeight: "600",
  },
  hint: {
    marginTop: 24,
    color: brand.white,
    opacity: 0.85,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
});
