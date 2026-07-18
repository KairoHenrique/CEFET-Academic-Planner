import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
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
import { registerPushForCurrentSession } from "./src/push/register";
import { HomePlaceholderScreen } from "./src/screens/HomePlaceholderScreen";
import { LoginScreen } from "./src/screens/LoginScreen";
import { PaywallScreen } from "./src/screens/PaywallScreen";
import { brand } from "./src/theme/brand";

/**
 * AuthGate + SubscriptionGate (M4) · push register (M6) · home até M7.
 */
export default function App() {
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

  if (!ready) {
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
    <>
      <HomePlaceholderScreen session={session} />
      <StatusBar style="light" />
    </>
  );
}

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    backgroundColor: brand.blue,
    alignItems: "center",
    justifyContent: "center",
  },
});
