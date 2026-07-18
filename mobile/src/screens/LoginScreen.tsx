import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { ApiClientError, loginAndPersist } from "../auth/api";
import { formatCpfInput, isValidCpf, normalizeCpf } from "../auth/cpf";
import { brand } from "../theme/brand";

type Props = {
  apiConfigured: boolean;
};

export function LoginScreen({ apiConfigured }: Props) {
  const [cpf, setCpf] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit() {
    setError(null);
    const normalized = normalizeCpf(cpf);
    if (!isValidCpf(normalized) || !password.trim()) {
      setError("Informe CPF e senha válidos.");
      return;
    }
    if (!apiConfigured) {
      setError("Configure EXPO_PUBLIC_API_BASE_URL em mobile/.env");
      return;
    }

    setBusy(true);
    try {
      await loginAndPersist({ cpf: normalized, password });
      setPassword("");
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : "Não foi possível entrar. Tente novamente."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.root}>
      <Text style={styles.brand}>ACME HUB</Text>
      <Text style={styles.subtitle}>Entrar com sua conta</Text>
      <Text style={styles.hint}>Mesmo CPF e senha do site</Text>

      {!apiConfigured ? (
        <Text style={styles.warn}>
          Falta EXPO_PUBLIC_API_BASE_URL no mobile/.env
        </Text>
      ) : null}

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="CPF"
          placeholderTextColor="rgba(255,255,255,0.45)"
          keyboardType="number-pad"
          autoCapitalize="none"
          autoComplete="username"
          value={cpf}
          onChangeText={(value) => setCpf(formatCpfInput(value))}
          editable={!busy}
          maxLength={14}
        />
        <TextInput
          style={styles.input}
          placeholder="Senha"
          placeholderTextColor="rgba(255,255,255,0.45)"
          secureTextEntry
          autoComplete="password"
          value={password}
          onChangeText={setPassword}
          editable={!busy}
          onSubmitEditing={() => void onSubmit()}
        />
        <Pressable
          style={[styles.button, busy && styles.disabled]}
          onPress={() => void onSubmit()}
          disabled={busy || !apiConfigured}
        >
          {busy ? (
            <ActivityIndicator color={brand.blue} />
          ) : (
            <Text style={styles.buttonText}>Entrar</Text>
          )}
        </Pressable>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: brand.bg,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  brand: {
    color: brand.text,
    fontSize: 36,
    fontWeight: "800",
    letterSpacing: 1,
    textAlign: "center",
  },
  subtitle: {
    marginTop: 10,
    color: brand.gold,
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  hint: {
    marginTop: 6,
    color: brand.textSecondary,
    fontSize: 13,
    textAlign: "center",
  },
  warn: {
    marginTop: 16,
    color: brand.danger,
    textAlign: "center",
    fontSize: 13,
  },
  form: {
    marginTop: 28,
    gap: 10,
    maxWidth: 400,
    width: "100%",
    alignSelf: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: brand.border,
    backgroundColor: brand.glass,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: brand.text,
    fontSize: 16,
  },
  button: {
    backgroundColor: brand.gold,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    minHeight: 48,
    justifyContent: "center",
  },
  disabled: { opacity: 0.55 },
  buttonText: {
    color: brand.bg,
    fontWeight: "700",
    fontSize: 16,
  },
  error: {
    marginTop: 16,
    color: brand.danger,
    textAlign: "center",
    fontSize: 14,
  },
});
