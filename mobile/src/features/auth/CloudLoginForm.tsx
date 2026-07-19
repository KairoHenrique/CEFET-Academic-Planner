import { useState } from "react";
import { View } from "react-native";
import { ApiClientError, loginAndPersist } from "../../auth/api";
import { formatCpfInput, isValidCpf, normalizeCpf } from "../../auth/cpf";
import { AuthField } from "./AuthField";
import { AuthNotice } from "./AuthNotice";
import { AuthSubmitButton } from "./AuthSubmitButton";
import { PasswordField } from "./PasswordField";

type Props = {
  apiConfigured: boolean;
  disabled?: boolean;
};

export function CloudLoginForm({ apiConfigured, disabled }: Props) {
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

  const locked = busy || disabled || !apiConfigured;

  return (
    <View style={{ gap: 12 }}>
      <AuthField
        label="CPF"
        value={cpf}
        onChangeText={(v) => setCpf(formatCpfInput(v))}
        placeholder="000.000.000-00"
        keyboardType="number-pad"
        autoComplete="username"
        editable={!locked}
        maxLength={14}
      />
      <PasswordField
        label="Senha"
        value={password}
        onChangeText={setPassword}
        placeholder="Senha do SIGAA"
        editable={!locked}
        hint="Mesma senha usada no portal SIGAA."
      />
      <AuthSubmitButton
        variant="login"
        loading={busy}
        disabled={locked && !busy}
        onPress={() => void onSubmit()}
      />
      <AuthNotice
        open={Boolean(error)}
        kicker="Não foi possível entrar"
        message={error}
        onDismiss={() => setError(null)}
      />
    </View>
  );
}
