"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { SyncProgress } from "@/components/ui/SyncProgress";
import { ToggleOption } from "@/components/ui/ToggleOption";
import { Icon } from "@/components/ui/Icon";
import { useSync } from "@/hooks/useSync";
import { ApiClientError, getSyncReadiness, postSigaaVerify } from "@/lib/api/client";
import { saveSyncCredentials } from "@/lib/auth/credentials";
import { markBackgroundSyncPending } from "@/lib/auth/background-sync";
import { setSession } from "@/lib/auth/session";
import { brand } from "@/config/brand";
import { LoginCard } from "@/components/auth/LoginCard";
import { PlannerNotice } from "@/components/ui/PlannerNotice";

export function SigaaLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sync = useSync();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [savePassword, setSavePassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorEpoch, setErrorEpoch] = useState(0);

  const showError = (message: string) => {
    setErrorMessage(message);
    setErrorEpoch((value) => value + 1);
  };
  const [entering, setEntering] = useState(false);
  const [isFirstLoginSync, setIsFirstLoginSync] = useState(false);

  useEffect(() => {
    if (searchParams.get("error") === "credentials") {
      showError(
        "Senha incorreta. Os dados em cache foram preservados — tente novamente."
      );
    }
  }, [searchParams]);

  useEffect(() => {
    if (sync.error && !sync.syncing) {
      showError(sync.error);
    }
  }, [sync.error, sync.syncing]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage(null);
    sync.resetError();
    setIsFirstLoginSync(false);

    const trimmedUsername = username.trim();

    if (!trimmedUsername || !password.trim()) {
      showError("Preencha usuário e senha do SIGAA.");
      return;
    }

    const credentials = {
      username: trimmedUsername,
      password,
      savePassword,
    };

    try {
      const readiness = await getSyncReadiness(trimmedUsername);

      if (readiness.canFastLogin) {
        await postSigaaVerify(credentials);

        setEntering(true);
        saveSyncCredentials(credentials, savePassword);
        setSession({
          mode: "sigaa",
          username: trimmedUsername,
          savePassword,
          loggedAt: new Date().toISOString(),
        });
        markBackgroundSyncPending();
        router.push("/");
        router.refresh();
        return;
      }
    } catch (error) {
      if (error instanceof ApiClientError) {
        showError(error.message);
        return;
      }
    }

    setIsFirstLoginSync(true);
    const ok = await sync.startSync(credentials, {
      mode: "full",
      trigger: "first_login",
    });
    if (!ok) {
      setIsFirstLoginSync(false);
      return;
    }

    saveSyncCredentials(credentials, savePassword);
    setSession({
      mode: "sigaa",
      username: trimmedUsername,
      savePassword,
      loggedAt: new Date().toISOString(),
    });
    router.push("/");
    router.refresh();
  };

  const busy = sync.syncing || entering;

  return (
    <LoginCard
      subtitle="Mesmo usuário e senha do portal SIGAA."
      foot={
        <a
          href={brand.signupUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="login-foot-link"
        >
          Criar conta no SIGAA
        </a>
      }
    >
      <form
        className={`login-form ${busy ? "login-form--syncing" : ""}`}
        onSubmit={(event) => void handleSubmit(event)}
      >
        <div className="login-fields">
          <Input
            label="Usuário"
            type="text"
            autoComplete="username"
            autoFocus
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="Login do SIGAA"
            disabled={busy}
          />
          <PasswordInput
            label="Senha"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Senha do portal"
            disabled={busy}
          />
        </div>

        <div className="login-remember">
          <ToggleOption
            label="Lembrar senha neste computador"
            checked={savePassword}
            onChange={setSavePassword}
            disabled={busy}
          />
        </div>

        {sync.syncing && (
          <div className="login-sync-panel">
            <SyncProgress progress={sync.progress} stepLabel={sync.stepLabel} />
          </div>
        )}

        <div className="login-actions">
          <button
            type="submit"
            className="btn-gold login-submit"
            disabled={busy}
          >
            <Icon
              name="sync"
              size={16}
              className={busy ? "sync-icon-spinning" : undefined}
              aria-hidden
            />
            {sync.syncing
              ? "Sincronizando…"
              : entering
                ? "Entrando…"
                : "Entrar"}
          </button>

          {sync.syncing && isFirstLoginSync && (
            <p className="login-first-sync-hint" role="status">
              É seu primeiro acesso — estamos baixando todo o seu histórico do
              SIGAA. Isso pode levar alguns minutos; não feche esta página.
            </p>
          )}
        </div>
      </form>

      <PlannerNotice
        open={Boolean(errorMessage)}
        message={errorMessage}
        noticeKey={errorEpoch}
        kicker="Não foi possível entrar"
        onDismiss={() => {
          setErrorMessage(null);
          sync.resetError();
        }}
      />
    </LoginCard>
  );
}
