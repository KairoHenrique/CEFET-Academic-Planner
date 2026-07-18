import { StatusBar } from "expo-status-bar";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { WebView, type WebViewNavigation } from "react-native-webview";
import { useEffect } from "react";
import { getWebBaseUrl, hasWebBaseUrl } from "./src/config/env";

const BG = "#001020";
const GOLD = "#E8C66A";

/**
 * App = site mobile F28 dentro do WebView.
 * Sem telas nativas reinventadas — login, dados e UI são os do site.
 */
export default function App() {
  const configured = hasWebBaseUrl();
  const uri = useMemo(() => (configured ? getWebBaseUrl() : ""), [configured]);
  const webRef = useRef<WebView>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const onAndroidBack = useCallback(() => {
    if (canGoBack && webRef.current) {
      webRef.current.goBack();
      return true;
    }
    return false;
  }, [canGoBack]);

  useEffect(() => {
    if (Platform.OS !== "android") return;
    const sub = BackHandler.addEventListener("hardwareBackPress", onAndroidBack);
    return () => sub.remove();
  }, [onAndroidBack]);

  if (!configured) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>ACME HUB</Text>
        <Text style={styles.msg}>
          Configure EXPO_PUBLIC_API_BASE_URL em mobile/.env com a URL do site
          (ex.: https://acme-hub.khfm.workers.dev).
        </Text>
        <StatusBar style="light" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
        {error ? (
          <View style={styles.center}>
            <Text style={styles.title}>Falha ao carregar</Text>
            <Text style={styles.msg}>{error}</Text>
            <Pressable
              style={styles.btn}
              onPress={() => {
                setError(null);
                setLoading(true);
                webRef.current?.reload();
              }}
            >
              <Text style={styles.btnText}>Tentar de novo</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <WebView
              ref={webRef}
              source={{ uri }}
              style={styles.web}
              onLoadStart={() => setLoading(true)}
              onLoadEnd={() => setLoading(false)}
              onNavigationStateChange={(nav: WebViewNavigation) => {
                setCanGoBack(nav.canGoBack);
              }}
              onError={(e) => {
                setLoading(false);
                setError(
                  e.nativeEvent.description ||
                    "Não foi possível abrir o site."
                );
              }}
              onHttpError={(e) => {
                if (e.nativeEvent.statusCode >= 500) {
                  setError(`HTTP ${e.nativeEvent.statusCode}`);
                }
              }}
              startInLoadingState
              renderLoading={() => (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator color={GOLD} size="large" />
                </View>
              )}
              javaScriptEnabled
              domStorageEnabled
              sharedCookiesEnabled
              thirdPartyCookiesEnabled
              allowsBackForwardNavigationGestures
              setSupportMultipleWindows={false}
              applicationNameForUserAgent="ACMEHubAndroid"
            />
            {loading ? (
              <View style={styles.loadingOverlay} pointerEvents="none">
                <ActivityIndicator color={GOLD} size="large" />
              </View>
            ) : null}
          </>
        )}
        <StatusBar style="light" />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: BG,
  },
  web: {
    flex: 1,
    backgroundColor: BG,
  },
  center: {
    flex: 1,
    backgroundColor: BG,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  title: {
    color: GOLD,
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
  },
  msg: {
    marginTop: 12,
    color: "#C2CDD8",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  btn: {
    marginTop: 20,
    backgroundColor: GOLD,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  btnText: {
    color: BG,
    fontWeight: "700",
    fontSize: 15,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: BG,
    alignItems: "center",
    justifyContent: "center",
  },
});
