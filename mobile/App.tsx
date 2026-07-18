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
import { HomePlaceholderScreen } from "./src/screens/HomePlaceholderScreen";
import { LoginScreen } from "./src/screens/LoginScreen";
import { PaywallScreen } from "./src/screens/PaywallScreen";
import { brand } from "./src/theme/brand";

/**
 * M4 — AuthGate + SubscriptionGate.
 * Sem sessão → login; bloqueado → paywall; liberado → home (placeholder até M7).
 */
export default function App() {
  const [ready, setReady] = useState(false);
  const [session, setSessionState] = useState<MobileAuthSession | null>(null);
  const apiOk = hasApiBaseUrl();

  useEffect(() => {
    const unsub = subscribeSession((next) => setSessionState(next));
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
      setSessionState(getSession());
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
