"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  ApiClientError,
  postTurmasOfertadasSync,
} from "@/lib/api/client";
import {
  getSyncCredentials,
  saveSyncCredentials,
} from "@/lib/auth/credentials";
import { resolveSyncStartCredentials } from "@/lib/auth/resolve-sync-start-credentials";
import { isCloudSession } from "@/lib/auth/session";
import { needsSyncPassword } from "@/lib/auth/sync-session";
import { pollSyncJobUntilDone } from "@/lib/sync-queue/poll-sync-job-client";
import { queryKeys } from "@/lib/query/keys";
import { resolveTurmasSyncFeedback } from "@/lib/simulador/turmas-sync-feedback";
import type { TurmasSyncFeedbackTone } from "@/lib/simulador/turmas-sync-feedback";
import { startTurmasSyncProgress } from "@/lib/simulador/turmas-sync-progress";
import type { SyncRequest } from "@/lib/types/sync";

interface RunTurmasSyncOptions {
  force?: boolean;
}

interface UseTurmasOfertadasSyncOptions {
  autoRun?: boolean;
  onComplete?: (message: string) => void;
}

function mapTurmasSyncError(error: unknown): string {
  if (error instanceof ApiClientError) {
    return error.message;
  }
  return "Não foi possível atualizar as turmas ofertadas.";
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function useTurmasOfertadasSync(
  { autoRun = false, onComplete }: UseTurmasOfertadasSyncOptions = {}
) {
  const queryClient = useQueryClient();
  const [syncing, setSyncing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stepLabel, setStepLabel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [lastMessage, setLastMessage] = useState<string | null>(null);
  const [lastMessageTone, setLastMessageTone] =
    useState<TurmasSyncFeedbackTone | null>(null);
  const [passwordPromptOpen, setPasswordPromptOpen] = useState(false);
  const autoRanRef = useRef(false);

  const invalidateTurmas = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.turmasOfertadas() });
  }, [queryClient]);

  const resetProgress = useCallback(() => {
    setProgress(0);
    setStepLabel("");
  }, []);

  const runSync = useCallback(
    async (
      credentials?: SyncRequest,
      runOptions: RunTurmasSyncOptions = {}
    ): Promise<boolean> => {
      if (syncing) return false;

      // No cloud a senha SIGAA está no servidor — as credenciais vêm da sessão.
      const creds = credentials ?? resolveSyncStartCredentials();
      if (!creds?.username) {
        setError("Faça login e sincronize com o SIGAA para buscar turmas.");
        return false;
      }

      setSyncing(true);
      setError(null);
      resetProgress();

      const stopProgress = startTurmasSyncProgress((step) => {
        setProgress(step.progress);
        setStepLabel(step.label);
      });

      try {
        const result = await postTurmasOfertadasSync(
          { ...creds, mode: creds.mode ?? "incremental" },
          { force: runOptions.force === true }
        );

        // Cloud: o robô roda no worker do PC — aguarda o job concluir antes de
        // refazer o fetch, senão a lista continua vazia.
        if (result.cloud && result.jobId) {
          await pollSyncJobUntilDone(result.jobId, {
            sigaaUsername: creds.username,
          });
          stopProgress();
          setStepLabel("Concluído");
          setProgress(100);
          setLastMessage("Turmas ofertadas atualizadas.");
          setLastMessageTone("success");
          onComplete?.("Turmas ofertadas atualizadas.");
          await invalidateTurmas();
          await delay(350);
          resetProgress();
          setSyncing(false);
          return true;
        }

        stopProgress();
        setStepLabel("Concluído");
        setProgress(100);

        if (result.skipped) {
          setLastMessage(null);
          setLastMessageTone(null);
        } else {
          const feedback = resolveTurmasSyncFeedback(result);
          const shouldShow =
            feedback.tone === "warning" ||
            (feedback.tone === "success" &&
              result.rowsWritten > 0 &&
              !result.partial);

          if (shouldShow) {
            setLastMessage(feedback.message);
            setLastMessageTone(feedback.tone);
            onComplete?.(feedback.message);
          } else {
            setLastMessage(null);
            setLastMessageTone(null);
          }
        }

        await invalidateTurmas();
        await delay(350);
        resetProgress();
        setSyncing(false);
        return true;
      } catch (err) {
        stopProgress();
        resetProgress();
        setError(mapTurmasSyncError(err));
        setSyncing(false);
        return false;
      }
    },
    [syncing, invalidateTurmas, onComplete, resetProgress]
  );

  const requestSync = useCallback(
    (runOptions?: RunTurmasSyncOptions) => {
      const creds = resolveSyncStartCredentials();
      if (!creds?.username) {
        setError("Faça login e sincronize com o SIGAA para buscar turmas.");
        return;
      }

      // Cloud: identidade vem da sessão e a senha está no servidor — dispara
      // direto. Modo SIGAA local ainda pede a senha quando necessário.
      if (!isCloudSession() && needsSyncPassword(creds.username)) {
        setPasswordPromptOpen(true);
        return;
      }

      void runSync(undefined, runOptions);
    },
    [runSync]
  );

  const submitPasswordAndSync = useCallback(
    (password: string, runOptions?: RunTurmasSyncOptions) => {
      const creds = getSyncCredentials();
      if (!creds?.username || !password.trim()) return;

      saveSyncCredentials(
        { username: creds.username, password, savePassword: creds.savePassword },
        creds.savePassword === true
      );

      setPasswordPromptOpen(false);
      void runSync(
        {
          username: creds.username,
          password,
          savePassword: creds.savePassword,
        },
        runOptions
      );
    },
    [runSync]
  );

  useEffect(() => {
    if (!autoRun || autoRanRef.current) return;

    const creds = resolveSyncStartCredentials();
    if (!creds?.username) return;
    if (!isCloudSession() && needsSyncPassword(creds.username)) return;

    autoRanRef.current = true;
    void runSync(undefined, { force: false });
  }, [autoRun, runSync]);

  return {
    syncing,
    progress,
    stepLabel,
    error,
    lastMessage,
    lastMessageTone,
    passwordPromptOpen,
    setPasswordPromptOpen,
    requestSync,
    submitPasswordAndSync,
    runSync,
  };
}
