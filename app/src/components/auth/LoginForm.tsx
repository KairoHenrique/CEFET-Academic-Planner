"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { SyncProgress } from "@/components/ui/SyncProgress";
import { ToggleOption } from "@/components/ui/ToggleOption";
import { Icon } from "@/components/ui/Icon";
import { useSync } from "@/hooks/useSync";
import { saveSyncCredentials } from "@/lib/auth/credentials";
import { setSession } from "@/lib/auth/session";
import { brand } from "@/config/brand";
import { LoginCard } from "@/components/auth/LoginCard";

export function LoginForm() {
  const router = useRouter();
  const sync = useSync();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [savePassword, setSavePassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    sync.resetError();

    const trimmedUsername = username.trim();

    if (!trimmedUsername || !password.trim()) {
      setFormError("Preencha usuário e senha do SIGAA.");
      return;
    }

    const credentials = {
      username: trimmedUsername,
      password,
      savePassword,
    };

    const ok = await sync.startSync(credentials);
    if (!ok) return;

    saveSyncCredentials(credentials, savePassword);
    setSession({
      username: trimmedUsername,
      savePassword,
      loggedAt: new Date().toISOString(),
    });
    router.push("/");
    router.refresh();
  };

  const displayError = formError ?? sync.error;

  return (
    <LoginCard
      foot={
        <a
          href={brand.signupUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="login-foot-link"
        >
          Criar conta
        </a>
      }
    >
      <form
        className={`login-form ${sync.syncing ? "login-form--syncing" : ""}`}
        onSubmit={handleSubmit}
      >
        <div className="login-fields">
          <Input
            label="Usuário"
            type="text"
            autoComplete="username"
            autoFocus
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Login do SIGAA"
            disabled={sync.syncing}
          />
          <PasswordInput
            label="Senha"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Senha do portal"
            disabled={sync.syncing}
          />
        </div>

        <div className="login-remember">
          <ToggleOption
            label="Lembrar senha neste computador"
            checked={savePassword}
            onChange={setSavePassword}
            disabled={sync.syncing}
          />
        </div>

        {displayError && (
          <div className="login-error" role="alert">
            {displayError}
          </div>
        )}

        {sync.syncing && (
          <div className="login-sync-panel">
            <SyncProgress progress={sync.progress} stepLabel={sync.stepLabel} />
          </div>
        )}

        <div className="login-actions">
          <button
            type="submit"
            className="btn-gold login-submit"
            disabled={sync.syncing}
          >
            <Icon
              name="sync"
              size={16}
              className={sync.syncing ? "sync-icon-spinning" : undefined}
              aria-hidden
            />
            {sync.syncing ? "Sincronizando…" : "Entrar e sincronizar"}
          </button>
        </div>
      </form>
    </LoginCard>
  );
}
