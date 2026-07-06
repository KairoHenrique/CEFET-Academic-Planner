"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { PlannerSelect } from "@/components/ui/PlannerSelect";
import { AuthTrialBanner } from "@/components/auth/AuthTrialBanner";
import { AuthSubmitButton } from "@/components/auth/AuthSubmitButton";
import { RegisterAccountExistsNotice } from "@/components/auth/RegisterAccountExistsNotice";
import { PlannerNotice } from "@/components/ui/PlannerNotice";
import { ApiClientError, postAuthRegister } from "@/lib/api/client";
import type { AppCursoId } from "@/lib/auth/account/types";
import { normalizeCpf, isValidCpf } from "@/lib/auth/account/cpf";
import {
  isValidEmail,
  isValidTelefone,
  normalizeEmail,
  normalizeTelefone,
} from "@/lib/auth/account/contact-fields";
import {
  formatCpfInput,
  formatPhoneInput,
} from "@/lib/auth/account/format-auth-fields";
import { persistCloudAuthSession } from "@/lib/auth/persist-cloud-session";
import { resolvePostAuthRedirect } from "@/lib/billing/post-auth-redirect";
import { redeemPendingGiftKeyAfterAuth } from "@/lib/billing/gift-keys/redeem-pending-gift-key-after-auth";
import type { AuthCursoOption } from "@/lib/types/auth-api";

interface RegisterFormProps {
  cursos: readonly AuthCursoOption[];
}

export function RegisterForm({ cursos }: RegisterFormProps) {
  const router = useRouter();
  const defaultCursoId = cursos[0]?.id ?? "eng-computacao";

  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cpf, setCpf] = useState("");
  const [cursoId, setCursoId] = useState<AppCursoId>(defaultCursoId);
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorEpoch, setErrorEpoch] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [accountExists, setAccountExists] = useState(false);

  const cursoOptions = useMemo(
    () => cursos.map((curso) => ({ value: curso.id, label: curso.label })),
    [cursos]
  );

  const showError = (message: string) => {
    setErrorMessage(message);
    setErrorEpoch((value) => value + 1);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage(null);
    setAccountExists(false);

    const normalizedEmail = normalizeEmail(email);
    const normalizedPhone = normalizeTelefone(telefone);
    const normalizedCpf = normalizeCpf(cpf);

    if (!isValidEmail(normalizedEmail)) {
      showError("Informe um e-mail válido.");
      return;
    }
    if (!isValidTelefone(normalizedPhone)) {
      showError("Informe telefone com DDD (10 ou 11 dígitos).");
      return;
    }
    if (!isValidCpf(normalizedCpf)) {
      showError("Informe um CPF válido.");
      return;
    }
    if (password.trim().length < 4) {
      showError("A senha do SIGAA deve ter ao menos 4 caracteres.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await postAuthRegister({
        email: normalizedEmail,
        telefone: normalizedPhone,
        cpf: normalizedCpf,
        cursoId,
        password,
      });
      persistCloudAuthSession(result);
      const giftRedeem = await redeemPendingGiftKeyAfterAuth();
      router.push(
        giftRedeem.redeemed ? "/" : resolvePostAuthRedirect(result.subscription)
      );
      router.refresh();
    } catch (error) {
      if (error instanceof ApiClientError && error.code === "ACCOUNT_EXISTS") {
        setAccountExists(true);
        return;
      }
      showError(
        error instanceof ApiClientError
          ? error.message
          : "Não foi possível criar a conta. Tente novamente."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      className="login-form"
      onSubmit={(event) => void handleSubmit(event)}
      aria-labelledby="auth-tab-register"
      id="auth-panel-register"
      role="tabpanel"
    >
      <div className="login-fields">
        <Input
          label="E-mail"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="seu@email.com"
          disabled={submitting}
        />
        <Input
          label="Telefone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          value={telefone}
          onChange={(event) => setTelefone(formatPhoneInput(event.target.value))}
          placeholder="(31) 99999-9999"
          disabled={submitting}
        />
        <Input
          label="CPF"
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={cpf}
          onChange={(event) => setCpf(formatCpfInput(event.target.value))}
          placeholder="000.000.000-00"
          disabled={submitting}
        />
        <div className="form-field">
          <PlannerSelect
            id="register-curso"
            label="Curso"
            value={cursoId}
            options={cursoOptions}
            fullWidth
            onChange={setCursoId}
          />
          <span className="form-hint">
            Define qual PPC será usado no mapa e na integralização.
          </span>
        </div>
        <PasswordInput
          label="Senha do SIGAA"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Senha do portal"
          disabled={submitting}
        />
        <p className="form-hint">
          Usada para sincronizar seus dados acadêmicos com segurança.
        </p>
      </div>

      <AuthTrialBanner />

      {accountExists ? <RegisterAccountExistsNotice /> : null}

      {!accountExists ? (
        <div className="login-actions">
          <AuthSubmitButton variant="register" loading={submitting} />
        </div>
      ) : null}

      {!accountExists ? (
        <PlannerNotice
          open={Boolean(errorMessage)}
          message={errorMessage}
          noticeKey={errorEpoch}
          kicker="Verifique os dados"
          onDismiss={() => setErrorMessage(null)}
        />
      ) : null}
    </form>
  );
}
