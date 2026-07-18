import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { ApiClientError } from "../auth/api";
import { enqueueSync } from "../api/mutations";
import { getSession } from "../auth/session";
import { brand } from "../theme/brand";
import { cardStyles } from "../ui/cards";
import { Screen } from "../ui/Screen";
import { SegmentTabs } from "../ui/SegmentTabs";

type Mode = "lite" | "full";

export function SyncScreen() {
  const session = getSession();
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<Mode>("lite");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSync() {
    setError(null);
    setMessage(null);
    if (!session?.cpf) {
      setError("Sessão inválida. Faça login novamente.");
      return;
    }
    if (!password.trim()) {
      setError("Informe a senha do SIGAA para enfileirar o sync.");
      return;
    }

    setBusy(true);
    try {
      const result = await enqueueSync({
        username: session.cpf,
        password: password.trim(),
        mode,
        trigger: "manual",
      });
      setPassword("");
      setMessage(
        result.reused
          ? `Job já em andamento (${result.job.id} · ${result.job.status}).`
          : `Sync enfileirado (${result.job.id} · ${result.job.status}).`
      );
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : "Falha ao enfileirar sync."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen
      title="Sync SIGAA"
      subtitle="Mesma fila do botão Sync do site"
    >
      <View style={cardStyles.card}>
        <Text style={cardStyles.cardMeta}>
          Usuário: {session?.cpf ? `***${session.cpf.slice(-4)}` : "—"}
        </Text>
        <Text style={[cardStyles.cardMeta, { marginTop: 8 }]}>
          A senha não é armazenada no aparelho — só enviada na requisição do
          sync.
        </Text>
      </View>

      <Text style={cardStyles.sectionTitle}>Modo</Text>
      <SegmentTabs
        tabs={[
          { id: "lite", label: "Lite" },
          { id: "full", label: "Full" },
        ]}
        value={mode}
        onChange={setMode}
      />

      <TextInput
        style={styles.input}
        placeholder="Senha SIGAA"
        placeholderTextColor={brand.textMuted}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        editable={!busy}
      />

      <Pressable
        style={[styles.btn, busy && styles.disabled]}
        onPress={() => void onSync()}
        disabled={busy}
      >
        {busy ? (
          <ActivityIndicator color={brand.text} />
        ) : (
          <Text style={styles.btnText}>Sincronizar agora</Text>
        )}
      </Pressable>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {message ? <Text style={styles.ok}>{message}</Text> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: brand.glass,
    borderWidth: 1,
    borderColor: brand.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: brand.text,
    fontSize: 15,
    marginBottom: 14,
  },
  btn: {
    backgroundColor: brand.blue,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    minHeight: 48,
    justifyContent: "center",
  },
  disabled: { opacity: 0.55 },
  btnText: { color: brand.text, fontWeight: "800", fontSize: 15 },
  error: {
    marginTop: 12,
    color: brand.danger,
    textAlign: "center",
    fontWeight: "600",
  },
  ok: {
    marginTop: 12,
    color: brand.success,
    textAlign: "center",
    fontWeight: "600",
  },
});
