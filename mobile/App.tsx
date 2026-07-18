import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import {
  Outfit_700Bold,
  Outfit_800ExtraBold,
} from "@expo-google-fonts/outfit";
import { useFonts } from "expo-font";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { resolveAppDestination } from "./src/auth/access";
import {
  ensureFreshSession,
  syncSubscriptionFromPerfil,
} from "./src/auth/api";
import {
  getSession,
  hydrateSession,
  isAuthenticated,
  subscribeSession,
  type MobileAuthSession,
} from "./src/auth/session";
import { hasApiBaseUrl } from "./src/config/env";
import { MainTabs } from "./src/navigation/MainTabs";
import { registerPushForCurrentSession } from "./src/push/register";
import { LoginScreen } from "./src/screens/LoginScreen";
import { PaywallScreen } from "./src/screens/PaywallScreen";
import { brand } from "./src/theme/brand";

const navTheme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    primary: brand.gold,
    background: brand.bg,
    card: brand.glass,
    text: brand.text,
    border: brand.border,
    notification: brand.danger,
  },
};

/**
 * AuthGate + SubscriptionGate (M4) · push (M6) · MainTabs.
 * Tipografia F28: Outfit + Inter.
 */
export default function App() {
  const [fontsLoaded] = useFonts({
    Outfit_700Bold,
    Outfit_800ExtraBold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });
  const [ready, setReady] = useState(false);
  const [session, setSessionState] = useState<MobileAuthSession | null>(null);
  const apiOk = hasApiBaseUrl();

  useEffect(() => {
    const unsub = subscribeSession((next) => {
      setSessionState(next);
      if (next && resolveAppDestination(next.subscription.status) === "home") {
        void registerPushForCurrentSession();
      }
    });
    void (async () => {
      const stored = await hydrateSession();
      if (stored) {
        try {
          await ensureFreshSession();
          await syncSubscriptionFromPerfil();
        } catch {
          // Mantém snapshot local; gate usa status gravado.
        }
      }
      const current = getSession();
      setSessionState(current);
      if (
        current &&
        resolveAppDestination(current.subscription.status) === "home"
      ) {
        void registerPushForCurrentSession();
      }
      setReady(true);
    })();
    return unsub;
  }, []);

  if (!ready || !fontsLoaded) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator color={brand.gold} size="large" />
        <StatusBar style="light" />
      </View>
    );
  }

  if (!isAuthenticated(session) || !session) {
    return (
      <>
        <LoginScreen apiConfigured={apiOk} />
        <StatusBar style="light" />
      </>
    );
  }

  const destination = resolveAppDestination(session.subscription.status);

  if (destination === "paywall") {
    return (
      <>
        <PaywallScreen session={session} />
        <StatusBar style="light" />
      </>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer theme={navTheme}>
        <MainTabs />
      </NavigationContainer>
      <StatusBar style="light" />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    backgroundColor: brand.bg,
    alignItems: "center",
    justifyContent: "center",
  },
});
