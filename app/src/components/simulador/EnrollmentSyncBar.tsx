"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { SyncProgress } from "@/components/ui/SyncProgress";
import { formatTurmasSyncedAt } from "@/lib/simulador/turma-course-utils";
import type { TurmasSyncFeedbackTone } from "@/lib/simulador/turmas-sync-feedback";

/** Sucesso some sozinho; aviso/erro ficam até a próxima sync. */
const SYNC_SUCCESS_FEEDBACK_MS = 4500;

interface EnrollmentSyncBarProps {
  syncedAt: string | null;
  syncing: boolean;
  syncError: string | null;
  syncMessage?: string | null;
  syncMessageTone?: TurmasSyncFeedbackTone | null;
  passwordPromptOpen: boolean;
  onRequestSync: () => void;
  onClosePasswordPrompt: () => void;
  onSubmitPassword: (password: string) => void;
}

function feedbackClassName(tone: TurmasSyncFeedbackTone): string {
  if (tone === "success") return "enrollment-sync-feedback enrollment-sync-feedback--ok";
  return "enrollment-sync-feedback enrollment-sync-feedback--warning";
}

/** Progresso simulado: acelera no começo e desacelera perto de 90%. */
function useSyncProgress(syncing: boolean) {
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTick = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (syncing) {
      setProgress(0);
      intervalRef.current = setInterval(() => {
        setProgress((prev) => {
          if (prev < 30) return prev + 3;
          if (prev < 60) return prev + 1.5;
          if (prev < 85) return prev + 0.5;
          if (prev < 92) return prev + 0.15;
          return prev;
        });
      }, 100);
    } else {
      clearTick();
      setProgress((prev) => {
        if (prev > 0) return 100;
        return 0;
      });
      // Reset after completion flash
      const t = setTimeout(() => setProgress(0), 600);
      return () => clearTimeout(t);
    }
    return clearTick;
  }, [syncing, clearTick]);

  return Math.round(progress);
}

export function EnrollmentSyncBar({
  syncedAt,
  syncing,
  syncError,
  syncMessage,
  syncMessageTone = "success",
  passwordPromptOpen,
  onRequestSync,
  onClosePasswordPrompt,
  onSubmitPassword,
}: EnrollmentSyncBarProps) {
  const [password, setPassword] = useState("");
  const [successDismissed, setSuccessDismissed] = useState(false);
  const formattedSync = formatTurmasSyncedAt(syncedAt);
  const progress = useSyncProgress(syncing);

  const syncStatusLabel = useMemo(() => {
    if (syncing) return null;
    if (formattedSync) return `Atualizado ${formattedSync}`;
    return "Sem sincronização recente";
  }, [syncing, formattedSync]);

  useEffect(() => {
    setSuccessDismissed(false);
  }, [syncMessage, syncMessageTone]);

  useEffect(() => {
    if (syncMessageTone !== "success" || !syncMessage || successDismissed) {
      return;
    }

    const timer = window.setTimeout(() => {
      setSuccessDismissed(true);
    }, SYNC_SUCCESS_FEEDBACK_MS);

    return () => window.clearTimeout(timer);
  }, [syncMessage, syncMessageTone, successDismissed]);

  const handlePasswordSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!password.trim()) return;
    onSubmitPassword(password);
    setPassword("");
  };

  const showFeedback =
    Boolean(syncMessage) &&
    Boolean(syncMessageTone) &&
    (syncMessageTone === "warning" ||
      (syncMessageTone === "success" && !successDismissed));

  return (
    <>
      <header
        className="enrollment-sync-bar"
        aria-label="Status das turmas ofertadas"
        data-tutorial-id="tutorial-enrollment-sync"
      >
        <div className="enrollment-sync-meta">
          {syncStatusLabel ? (
            <span className="enrollment-sync-status">{syncStatusLabel}</span>
          ) : null}
        </div>

        <button
          type="button"
          className={`enrollment-sync-btn${syncing || progress > 0 ? " enrollment-sync-btn--loading" : ""}`}
          disabled={syncing}
          onClick={() => onRequestSync()}
          style={syncing || progress > 0 ? { "--sync-progress": `${progress}%` } as React.CSSProperties : undefined}
        >
          <span className="enrollment-sync-btn-fill" aria-hidden="true" />
          <Icon name="sync" size={15} className={syncing ? "sync-icon-spinning" : undefined} />
          {syncing ? `Buscando… ${progress}%` : "Sincronizar Minhas Turmas"}
        </button>
      </header>



      {showFeedback ? (
        <p
          className={feedbackClassName(syncMessageTone ?? "warning")}
          role={syncMessageTone === "warning" ? "alert" : "status"}
        >
          {syncMessage}
        </p>
      ) : null}

      {syncError ? (
        <p className="enrollment-sync-feedback enrollment-sync-feedback--error" role="alert">
          {syncError}
        </p>
      ) : null}

      <Modal
        open={passwordPromptOpen}
        onClose={() => {
          onClosePasswordPrompt();
          setPassword("");
        }}
        title="Senha do SIGAA"
      >
        <form className="enrollment-sync-password-form" onSubmit={handlePasswordSubmit}>
          <p className="enrollment-sync-password-copy">
            Informe sua senha do SIGAA para buscar as turmas ofertadas.
          </p>
          <Input
            type="password"
            label="Senha"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
          />
          <div className="enrollment-sync-password-actions">
            <button type="submit" className="btn-gold">
              Atualizar turmas
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}

