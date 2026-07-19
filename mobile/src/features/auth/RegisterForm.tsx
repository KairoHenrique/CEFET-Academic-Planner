import { useMemo, useState } from "react";
import { View } from "react-native";
import type { AppCursoId, AuthCursoOption } from "@acme/api-contracts";
import { ApiClientError, registerAndPersist } from "../../auth/api";
import { formatCpfInput, isValidCpf, normalizeCpf } from "../../auth/cpf";
import { AuthField } from "./AuthField";
import { AuthNotice } from "./AuthNotice";
import { AuthSubmitButton } from "./AuthSubmitButton";
import { AuthTrialBanner } from "./AuthTrialBanner";
import {
  buildLegalConsentPayload,
  formatPhoneInput,
  isValidEmail,
  isValidTelefone,
  normalizeEmail,
  normalizeTelefone,
} from "./auth-fields";
import { CursoPicker } from "./CursoPicker";
import { FriendMatriculaField } from "./FriendMatriculaField";
import {
  LegalConsentField,
} from "./LegalConsentField";
import { PasswordField } from "./PasswordField";
import { RegisterAccountExistsNotice } from "./RegisterAccountExistsNotice";

type Props = {
  cursos: readonly AuthCursoOption[];
  apiConfigured: boolean;
  disabled?: boolean;
  onGoToLogin: () => void;
};

export function RegisterForm({
  cursos,
  apiConfigured,
  disabled,
  onGoToLogin,
}: Props) {
  const defaultCursoId = (cursos[0]?.id ?? "eng-computacao") as AppCursoId;

  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cpf, setCpf] = useState("");
  const [cursoId, setCursoId] = useState<AppCursoId>(defaultCursoId);
  const [password, setPassword] = useState("");
  const [friendMatricula, setFriendMatricula] = useState("");
  const [legalAccepted, setLegalAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accountExists, setAccountExists] = useState(false);

  const locked = busy || disabled || !apiConfigured;

  const cursoList = useMemo(() => cursos, [cursos]);

  async function onSubmit() {
    setError(null);
    setAccountExists(false);

    const normalizedEmail = normalizeEmail(email);
    const normalizedPhone = normalizeTelefone(telefone);
    const normalizedCpf = normalizeCpf(cpf);

    if (!isValidEmail(normalizedEmail)) {
      setError("Informe um e-mail válido.");
      return;
    }
    if (!isValidTelefone(normalizedPhone)) {
      setError("Informe telefone com DDD (10 ou 11 dígitos).");
      return;
    }
    if (!isValidCpf(normalizedCpf)) {
      setError("Informe um CPF válido.");
      return;
    }
    if (password.trim().length < 4) {
      setError("A senha do SIGAA deve ter ao menos 4 caracteres.");
      return;
    }
    if (!legalAccepted) {
      setError(
        "Aceite os Termos de Uso e a Política de Privacidade para continuar."
      );
      return;
    }
    if (!apiConfigured) {
      setError("Configure EXPO_PUBLIC_API_BASE_URL em mobile/.env");
      return;
    }

    setBusy(true);
    try {
      await registerAndPersist({
        email: normalizedEmail,
        telefone: normalizedPhone,
        cpf: normalizedCpf,
        cursoId,
        password,
        friendMatricula: friendMatricula.trim() || undefined,
        acceptedLegal: buildLegalConsentPayload(true),
      });
      setPassword("");
    } catch (err) {
      if (err instanceof ApiClientError && err.code === "ACCOUNT_EXISTS") {
        setAccountExists(true);
        return;
      }
      setError(
        err instanceof ApiClientError
          ? err.message
          : "Não foi possível criar a conta. Tente novamente."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={{ gap: 12 }}>
      <AuthField
        label="E-mail"
        value={email}
        onChangeText={setEmail}
        placeholder="seu@email.com"
        keyboardType="email-address"
        autoComplete="email"
        editable={!locked}
      />
      <AuthField
        label="Telefone"
        value={telefone}
        onChangeText={(v) => setTelefone(formatPhoneInput(v))}
        placeholder="(31) 99999-9999"
        keyboardType="phone-pad"
        autoComplete="tel"
        editable={!locked}
        maxLength={15}
      />
      <AuthField
        label="CPF"
        value={cpf}
        onChangeText={(v) => setCpf(formatCpfInput(v))}
        placeholder="000.000.000-00"
        keyboardType="number-pad"
        autoComplete="off"
        editable={!locked}
        maxLength={14}
      />
      <CursoPicker
        cursos={cursoList}
        value={cursoId}
        onChange={(id) => setCursoId(id as AppCursoId)}
        disabled={locked}
      />
      <PasswordField
        label="Senha do SIGAA"
        value={password}
        onChangeText={setPassword}
        placeholder="Senha do portal"
        editable={!locked}
        autoComplete="password"
        hint="Usada para sincronizar seus dados acadêmicos com segurança."
      />

      <FriendMatriculaField
        value={friendMatricula}
        disabled={locked}
        onChange={setFriendMatricula}
      />

      <AuthTrialBanner />

      <LegalConsentField
        checked={legalAccepted}
        disabled={locked}
        onChange={setLegalAccepted}
      />

      {accountExists ? (
        <RegisterAccountExistsNotice onGoToLogin={onGoToLogin} />
      ) : (
        <>
          <AuthSubmitButton
            variant="register"
            loading={busy}
            disabled={locked && !busy}
            onPress={() => void onSubmit()}
          />
          <AuthNotice
            open={Boolean(error)}
            kicker="Verifique os dados"
            message={error}
            onDismiss={() => setError(null)}
          />
        </>
      )}
    </View>
  );
}
