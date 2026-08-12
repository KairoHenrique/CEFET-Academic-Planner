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
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { useFonts } from "expo-font";
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
import { navigationRef } from "./src/navigation/navigation-ref";
import { AppShell } from "./src/navigation/AppShell";
import { PaywallStack } from "./src/navigation/PaywallStack";
import { registerPushForCurrentSession, setupPushNotifications } from "./src/push/register";
import { setupNotificationNavigationListeners } from "./src/push/notification-navigation";
import { hydrateAvatarInitials } from "./src/perfil/avatar-store";
import { LoginScreen } from "./src/screens/LoginScreen";
import { brand } from "./src/theme/brand";
import { MaintenanceOverlay } from "./src/ui/MaintenanceOverlay";

async function lockAppPortrait(): Promise<void> {
  try {
    const ScreenOrientation = await import("expo-screen-orientation");
    await ScreenOrientation.lockAsync(
      ScreenOrientation.OrientationLock.PORTRAIT_UP
    );
  } catch {
    /* Expo Go / web */
  }
}

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
 * App nativo Android — clone F28 (navbar + drawer, sem WebView).
 * Login local · sessão SecureStore · cache · mutações · push.
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
    void lockAppPortrait();
    void setupPushNotifications();
    const removePushNav = setupNotificationNavigationListeners();
    const unsub = subscribeSession((next) => {
      setSessionState(next);
      if (next && resolveAppDestination(next.subscription.status) === "home") {
        void registerPushForCurrentSession();
      }
    });
    void (async () => {
      await hydrateAvatarInitials();
      const stored = await hydrateSession();
      if (stored) {
        try {
          await ensureFreshSession();
          await syncSubscriptionFromPerfil();
        } catch {
          // Mantém snapshot local.
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
    return () => {
      removePushNav();
      unsub();
    };
  }, []);

  if (!ready) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator color={brand.gold} size="large" />
        <StatusBar style="light" />
      </View>
    );
  }

  // Fontes: se falharem, segue com fallback do sistema.
  void fontsLoaded;

  if (!isAuthenticated(session) || !session) {
    return (
      <SafeAreaProvider>
        <LoginScreen apiConfigured={apiOk} />
        <MaintenanceOverlay />
        <StatusBar style="light" />
      </SafeAreaProvider>
    );
  }

  const destination = resolveAppDestination(session.subscription.status);

  if (destination === "paywall") {
    return (
      <SafeAreaProvider>
        <NavigationContainer ref={navigationRef} theme={navTheme}>
          <PaywallStack session={session} />
        </NavigationContainer>
        <MaintenanceOverlay />
        <StatusBar style="light" />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer ref={navigationRef} theme={navTheme}>
        <AppShell />
      </NavigationContainer>
      <MaintenanceOverlay />
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
