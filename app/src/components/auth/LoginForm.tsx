"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { SyncProgress } from "@/components/ui/SyncProgress";
import { Icon } from "@/components/ui/Icon";
import { useSync } from "@/hooks/useSync";
import { setSession } from "@/lib/auth/session";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { brand } from "@/config/brand";

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

    if (!username.trim() || !password.trim()) {
      setFormError("Preencha usuário e senha do SIGAA.");
      return;
    }

    const simulateError =
      password === "erro" ? "credentials" : username === "offline" ? "offline" : undefined;

    const ok = await sync.startSync({ simulateError });
    if (!ok) return;

    setSession({
      username: username.trim(),
      savePassword,
      loggedAt: new Date().toISOString(),
    });
    router.push("/");
    router.refresh();
  };

  return (
    <div className="login-page">
      <div className="login-card card">
        <div className="login-brand">
          <BrandLogo />
          <div>
            <h1 className="login-title">{brand.name}</h1>
            <p className="login-subtitle">Entre com suas credenciais do SIGAA</p>
          </div>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <Input
            label="Usuário SIGAA"
            type="text"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Matrícula ou usuário"
            disabled={sync.syncing}
          />
          <Input
            label="Senha"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Sua senha do portal"
            disabled={sync.syncing}
          />

          <label className="form-checkbox">
            <input
              type="checkbox"
              checked={savePassword}
              onChange={(e) => setSavePassword(e.target.checked)}
              disabled={sync.syncing}
            />
            <span>Salvar senha localmente (criptografada)</span>
          </label>

          {(formError || sync.error) && (
            <div className="login-error" role="alert">
              <Icon name="close" size={14} />
              {formError ?? sync.error}
            </div>
          )}

          {sync.syncing && (
            <SyncProgress progress={sync.progress} stepLabel={sync.stepLabel} />
          )}

          <button
            type="submit"
            className="btn-gold login-submit"
            disabled={sync.syncing}
          >
            <Icon name="sync" size={16} className={sync.syncing ? "sync-icon-spinning" : undefined} />
            {sync.syncing ? "Sincronizando…" : "Entrar e Sincronizar"}
          </button>
        </form>
      </div>
    </div>
  );
}
