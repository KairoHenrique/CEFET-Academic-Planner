import { Pressable, StyleSheet, Text, View } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { resolvePlanosFlowForStatus } from "../features/planos/planos-utils";
import { logoutLocal } from "../auth/logout";
import type { MobileAuthSession } from "../auth/session";
import { PlanosPixScreen } from "../screens/PlanosPixScreen";
import { PlanosScreen } from "../screens/PlanosScreen";
import type { RootStackParamList } from "./types";
import { brand } from "../theme/brand";

const Stack = createNativeStackNavigator<RootStackParamList>();

type Props = { session: MobileAuthSession };

/**
 * Paywall nativo F28 — planos + PIX (sem abrir o site).
 */
export function PaywallStack({ session }: Props) {
  const flow =
    resolvePlanosFlowForStatus(session.subscription.status) ?? "renew";

  return (
    <View style={styles.root}>
      <Stack.Navigator
        initialRouteName="Planos"
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: brand.bg },
          animation: "fade",
        }}
      >
        <Stack.Screen name="Planos">
          {() => (
            <PlanosScreen
              initialFlow={flow}
              paywall
              footerExtra={
                <Pressable
                  style={styles.logout}
                  onPress={() => void logoutLocal()}
                >
                  <Text style={styles.logoutText}>Sair da conta</Text>
                </Pressable>
              }
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="PlanosPix" component={PlanosPixScreen} />
      </Stack.Navigator>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: brand.bg },
  logout: {
    marginTop: 16,
    minHeight: 44,
    borderRadius: brand.radiusMd,
    borderWidth: 1,
    borderColor: brand.border,
    alignItems: "center",
    justifyContent: "center",
  },
  logoutText: {
    fontSize: 14,
    fontFamily: brand.fontBodySemi,
    fontWeight: "600",
    color: brand.textMuted,
  },
});
