import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  ensureFreshSession,
  loginAndPersist,
  logoutLocal,
} from "./src/auth/api";
import {
  getSession,
  hydrateSession,
  isAuthenticated,
  subscribeSession,
  type MobileAuthSession,
} from "./src/auth/session";
import { hasApiBaseUrl } from "./src/config/env";
import { brand } from "./src/theme/brand";

function maskCpf(cpf: string): string {
  const digits = cpf.replace(/\D/g, "");
  if (digits.length < 4) return "***";
  return `***${digits.slice(-4)}`;
}

/**
 * M1–M3: scaffold + contratos + sessão SecureStore.
 * Login UI definitivo entra em M4 — formulário abaixo é smoke de QA.
 */
export default function App() {
  const [ready, setReady] = useState(false);
  const [session, setSessionState] = useState<MobileAuthSession | null>(null);
  const [cpf, setCpf] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const apiOk = hasApiBaseUrl();

  useEffect(() => {
    const unsub = subscribeSession((next) => setSessionState(next));
    void (async () => {
      const stored = await hydrateSession();
      if (stored) {
        try {
          await ensureFreshSession();
        } catch {
          setMessage("Não foi possível renovar a sessão. Faça login de novo.");
        }
      }
      setSessionState(getSession());
      setReady(true);
    })();
    return unsub;
  }, []);

  async function onLogin() {
    setBusy(true);
    setMessage(null);
    try {
      await loginAndPersist({ cpf: cpf.trim(), password });
      setPassword("");
      setMessage("Sessão gravada no SecureStore.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Falha no login.");
    } finally {
      setBusy(false);
    }
  }

  async function onRefresh() {
    setBusy(true);
    setMessage(null);
    try {
      const next = await ensureFreshSession({ force: true });
      setMessage(next ? "Token renovado." : "Sem sessão.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Falha no refresh.");
    } finally {
      setBusy(false);
    }
  }

  async function onLogout() {
    setBusy(true);
    setMessage(null);
    try {
      await logoutLocal();
      setMessage("Sessão limpa (logout local).");
    } finally {
      setBusy(false);
    }
  }

  if (!ready) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color={brand.gold} />
        <StatusBar style="light" />
      </View>
    );
  }

  const loggedIn = isAuthenticated(session);

  return (
    <View style={styles.container}>
      <Text style={styles.brand}>ACME HUB</Text>
      <Text style={styles.subtitle}>Mobile · sessão M3</Text>

      <Text style={styles.status}>
        {loggedIn
          ? `Logado · CPF ${maskCpf(session!.cpf)} · curso ${session!.cursoId}`
          : "Sem sessão (SecureStore vazio)"}
      </Text>

      {!apiOk ? (
        <Text style={styles.warn}>
          Configure EXPO_PUBLIC_API_BASE_URL em mobile/.env
        </Text>
      ) : null}

      {!loggedIn ? (
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="CPF"
            placeholderTextColor="rgba(255,255,255,0.45)"
            keyboardType="number-pad"
            autoCapitalize="none"
            value={cpf}
            onChangeText={setCpf}
            editable={!busy}
          />
          <TextInput
            style={styles.input}
            placeholder="Senha"
            placeholderTextColor="rgba(255,255,255,0.45)"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            editable={!busy}
          />
          <Pressable
            style={[styles.button, busy && styles.buttonDisabled]}
            onPress={() => void onLogin()}
            disabled={busy || !apiOk}
          >
            <Text style={styles.buttonText}>Entrar (smoke)</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.form}>
          <Pressable
            style={[styles.button, busy && styles.buttonDisabled]}
            onPress={() => void onRefresh()}
            disabled={busy || !apiOk}
          >
            <Text style={styles.buttonText}>Forçar refresh</Text>
          </Pressable>
          <Pressable
            style={[styles.buttonSecondary, busy && styles.buttonDisabled]}
            onPress={() => void onLogout()}
            disabled={busy}
          >
            <Text style={styles.buttonTextLight}>Logout local</Text>
          </Pressable>
        </View>
      )}

      {message ? <Text style={styles.message}>{message}</Text> : null}
      <Text style={styles.hint}>UI de auth definitiva · M4</Text>
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
  status: {
    marginTop: 20,
    color: brand.white,
    fontSize: 14,
    textAlign: "center",
    opacity: 0.95,
  },
  warn: {
    marginTop: 12,
    color: "#ffb4b4",
    fontSize: 13,
    textAlign: "center",
  },
  form: {
    width: "100%",
    maxWidth: 360,
    marginTop: 20,
    gap: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: brand.white,
    fontSize: 16,
  },
  button: {
    backgroundColor: brand.gold,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonSecondary: {
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  buttonText: {
    color: brand.blue,
    fontWeight: "700",
    fontSize: 15,
  },
  buttonTextLight: {
    color: brand.white,
    fontWeight: "700",
    fontSize: 15,
  },
  message: {
    marginTop: 16,
    color: brand.white,
    fontSize: 13,
    textAlign: "center",
    opacity: 0.9,
  },
  hint: {
    marginTop: 28,
    color: brand.white,
    opacity: 0.7,
    fontSize: 12,
  },
});
