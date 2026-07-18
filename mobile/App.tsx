import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";
import type { AppCursoId } from "@acme/api-contracts";
import { brand } from "./src/theme/brand";

/** Smoke type-level: contratos M2 resolvem no bundle. */
const CURSO_SMOKE: AppCursoId = "eng-computacao";

/**
 * M1 — scaffold Expo (Android only · SDK 54).
 * M2 — `@acme/api-contracts` ligado.
 * Telas / auth entram em M3+.
 */
export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.brand}>ACME HUB</Text>
      <Text style={styles.subtitle}>Mobile Android · Bloco 8</Text>
      <Text style={styles.hint}>
        Expo Go · SDK 54 · contratos API ({CURSO_SMOKE}) · M1–M2
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
