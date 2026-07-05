"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { LoginCard } from "@/components/auth/LoginCard";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { PlannerNotice } from "@/components/ui/PlannerNotice";
import { Icon } from "@/components/ui/Icon";
import { ApiClientError } from "@/lib/api/client";

interface DevLoginFormProps {
  onLogin: (input: { email: string; password: string }) => Promise<void>;
  loading: boolean;
}

export function DevLoginForm({ onLogin, loading }: DevLoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorEpoch, setErrorEpoch] = useState(0);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    try {
      await onLogin({ email, password });
    } catch (caught) {
      const message =
        caught instanceof ApiClientError
          ? caught.message
          : "Não foi possível entrar no painel.";
      setErrorMessage(message);
      setErrorEpoch((value) => value + 1);
    }
  }

  return (
    <div className="dev-gate">
      <LoginCard
        subtitle="Operadores autorizados — dispara robôs e edita policy de sync."
        foot={
          <Link href="/login" className="login-foot-link">
            ← Login do aluno (SIGAA)
          </Link>
        }
      >
        <form className="login-form" onSubmit={handleSubmit}>
          <p className="dev-login-callout" role="note">
            Esta área <strong>não</strong> substitui o botão Sync SIGAA do
            dashboard. Use credenciais de <code>EMAIL_DEV</code> /{" "}
            <code>PASSWORD_DEV</code> no ambiente.
          </p>

          <div className="login-fields">
            <Input
              label="E-mail do operador"
              type="email"
              autoComplete="username"
              autoFocus
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="ops@exemplo.com"
              disabled={loading}
            />
            <PasswordInput
              label="Senha"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Senha do operador"
              disabled={loading}
            />
          </div>

          <div className="login-actions">
            <button type="submit" className="btn-gold login-submit" disabled={loading}>
              <Icon name="lock" size={16} aria-hidden />
              {loading ? "Entrando…" : "Entrar no painel"}
            </button>
          </div>
        </form>

        <PlannerNotice
          open={Boolean(errorMessage)}
          message={errorMessage}
          noticeKey={errorEpoch}
          kicker="Acesso negado"
          onDismiss={() => setErrorMessage(null)}
        />
      </LoginCard>
    </div>
  );
}
