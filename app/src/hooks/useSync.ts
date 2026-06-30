"use client";

import { useCallback, useState } from "react";
import {
  ApiClientError,
  notifySyncComplete,
  postSync,
} from "@/lib/api/client";
import { getSyncCredentials } from "@/lib/auth/credentials";
import type { SyncRequest, SyncStep } from "@/lib/types/sync";

const STEP_DELAY_MS = 280;

/** Live SIGAA ~3–5 min; barra avança suavemente até 92% enquanto o POST não retorna. */
const PENDING_TARGET_PROGRESS = 92;
const PENDING_ESTIMATED_MS = 4 * 60 * 1000;
const PENDING_TICK_MS = 900;

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function pendingLabelForProgress(progress: number): string {
  if (progress >= 78) return "Baixando histórico escolar…";
  if (progress >= 52) return "Baixando notas e faltas…";
  if (progress >= 38) return "Sincronizando turma virtual…";
  if (progress >= 22) return "Carregando portal do discente…";
  return "Autenticando no SIGAA…";
}

function startPendingSyncProgress(
  onStep: (step: SyncStep) => void
): () => void {
  const startedAt = Date.now();
  let progress = 5;

  onStep({ label: pendingLabelForProgress(progress), progress });

  const timer = window.setInterval(() => {
    const elapsed = Date.now() - startedAt;
    const estimated = Math.min(
      PENDING_TARGET_PROGRESS,
      5 + Math.floor((elapsed / PENDING_ESTIMATED_MS) * (PENDING_TARGET_PROGRESS - 5))
    );
    progress = Math.max(progress, estimated);
    onStep({ label: pendingLabelForProgress(progress), progress });
  }, PENDING_TICK_MS);

  return () => window.clearInterval(timer);
}

function mapSyncError(error: unknown): string {
  if (error instanceof ApiClientError) {
    return error.message;
  }
  return "Falha na sincronização. Tente novamente.";
}

async function playSyncSteps(steps: SyncStep[], onStep: (step: SyncStep) => void) {
  for (const step of steps) {
    onStep(step);
    if (step.progress < 100) {
      await delay(STEP_DELAY_MS);
    }
  }
}

export function useSync() {
  const [syncing, setSyncing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stepLabel, setStepLabel] = useState("");
  const [error, setError] = useState<string | null>(null);

  const startSync = useCallback(async (credentials?: SyncRequest) => {
    if (syncing) {
      return false;
    }

    setSyncing(true);
    setError(null);
    setProgress(0);
    setStepLabel("Iniciando sincronização…");

    const creds = credentials ?? getSyncCredentials();
    if (!creds) {
      setError("Credenciais não encontradas. Faça login novamente.");
      setSyncing(false);
      return false;
    }

    try {
      const stopPending = startPendingSyncProgress((step) => {
        setStepLabel(step.label);
        setProgress(step.progress);
      });

      let result: Awaited<ReturnType<typeof postSync>>;
      try {
        result = await postSync(creds);
      } finally {
        stopPending();
      }

      await playSyncSteps(result.steps, (step) => {
        setStepLabel(step.label);
        setProgress(step.progress);
      });

      notifySyncComplete();
      setSyncing(false);
      return true;
    } catch (err) {
      setError(mapSyncError(err));
      setSyncing(false);
      return false;
    }
  }, [syncing]);

  const resetError = useCallback(() => setError(null), []);

  return {
    syncing,
    progress,
    stepLabel,
    error,
    startSync,
    resetError,
  };
}

export type { SyncStep };
