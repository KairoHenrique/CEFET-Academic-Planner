"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { SyncProgress } from "@/components/ui/SyncProgress";
import { getSyncCredentials, saveSyncCredentials } from "@/lib/auth/credentials";
import { needsSyncPassword } from "@/lib/auth/sync-session";
import { useSync } from "@/hooks/useSync";

export function SyncButton() {
  const sync = useSync();
  const [passwordPromptOpen, setPasswordPromptOpen] = useState(false);
  const [password, setPassword] = useState("");

  const runSync = async (credentials?: { username: string; password: string; savePassword?: boolean }) => {
    sync.resetError();
    const ok = await sync.startSync(credentials);
    if (ok) {
      setPasswordPromptOpen(false);
      setPassword("");
    }
  };

  const handleClick = () => {
    const creds = getSyncCredentials();
    if (!creds?.username) {
      void runSync();
      return;
    }

    if (needsSyncPassword(creds.username)) {
      setPasswordPromptOpen(true);
      return;
    }

    void runSync();
  };

  const handlePasswordSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const creds = getSyncCredentials();
    if (!creds?.username || !password.trim()) return;

    saveSyncCredentials(
      { username: creds.username, password, savePassword: creds.savePassword },
      creds.savePassword === true
    );

    void runSync({
      username: creds.username,
      password,
      savePassword: creds.savePassword,
    });
  };

  return (
    <div className="navbar-sync-wrap">
      <button
        type="button"
        className="navbar-sync-btn"
        onClick={handleClick}
        disabled={sync.syncing}
        title="Sincronizar com SIGAA"
        aria-busy={sync.syncing}
        aria-expanded={passwordPromptOpen}
      >
        <Icon
          name="sync"
          size={15}
          className={sync.syncing ? "sync-icon-spinning" : undefined}
        />
        <span>{sync.syncing ? "Sincronizando" : "Sync SIGAA"}</span>
      </button>

      {passwordPromptOpen && !sync.syncing && (
        <form className="navbar-sync-password" onSubmit={handlePasswordSubmit}>
          <PasswordInput
            label="Senha SIGAA"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Sessão expirada — informe a senha"
          />
          <button type="submit" className="btn-gold btn-sm">
            Confirmar sync
          </button>
        </form>
      )}

      {sync.syncing && (
        <div className="navbar-sync-progress" role="status" aria-live="polite">
          <SyncProgress progress={sync.progress} stepLabel={sync.stepLabel} />
        </div>
      )}

      {sync.error && !sync.syncing && !passwordPromptOpen && (
        <p className="navbar-sync-error" role="alert">
          {sync.error}
        </p>
      )}
    </div>
  );
}
