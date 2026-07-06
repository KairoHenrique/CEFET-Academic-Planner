"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { AuthSubmitButton } from "@/components/auth/AuthSubmitButton";
import { PlannerNotice } from "@/components/ui/PlannerNotice";
import { ApiClientError, postAuthLogin } from "@/lib/api/client";
import { normalizeCpf, isValidCpf } from "@/lib/auth/account/cpf";
import { formatCpfInput } from "@/lib/auth/account/format-auth-fields";
import { persistCloudAuthSession } from "@/lib/auth/persist-cloud-session";
import { resolvePostAuthRedirect } from "@/lib/billing/post-auth-redirect";
import { redeemPendingGiftKeyAfterAuth } from "@/lib/billing/gift-keys/redeem-pending-gift-key-after-auth";

export function CloudLoginForm() {
  const router = useRouter();
  const [cpf, setCpf] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorEpoch, setErrorEpoch] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const showError = (message: string) => {
    setErrorMessage(message);
    setErrorEpoch((value) => value + 1);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage(null);

    const normalizedCpf = normalizeCpf(cpf);
    if (!isValidCpf(normalizedCpf) || !password.trim()) {
      showError("Informe CPF e senha válidos.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await postAuthLogin({
        cpf: normalizedCpf,
        password,
      });
      persistCloudAuthSession(result);
      const giftRedeem = await redeemPendingGiftKeyAfterAuth();
      router.push(
        giftRedeem.redeemed ? "/" : resolvePostAuthRedirect(result.subscription)
      );
      router.refresh();
    } catch (error) {
      showError(
        error instanceof ApiClientError
          ? error.message
          : "Não foi possível entrar. Tente novamente."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      className="login-form"
      onSubmit={(event) => void handleSubmit(event)}
      aria-labelledby="auth-tab-login"
      id="auth-panel-login"
      role="tabpanel"
    >
      <div className="login-fields">
        <Input
          label="CPF"
          type="text"
          inputMode="numeric"
          autoComplete="username"
          autoFocus
          value={cpf}
          onChange={(event) => setCpf(formatCpfInput(event.target.value))}
          placeholder="000.000.000-00"
          disabled={submitting}
        />
        <PasswordInput
          label="Senha"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Senha do SIGAA"
          disabled={submitting}
        />
        <p className="form-hint">Mesma senha usada no portal SIGAA.</p>
      </div>

      <div className="login-actions">
        <AuthSubmitButton variant="login" loading={submitting} />
      </div>

      <PlannerNotice
        open={Boolean(errorMessage)}
        message={errorMessage}
        noticeKey={errorEpoch}
        kicker="Não foi possível entrar"
        onDismiss={() => setErrorMessage(null)}
      />
    </form>
  );
}
