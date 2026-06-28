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

/** Etapas exibidas enquanto o servidor raspa o SIGAA (~2 min). */
const PENDING_SYNC_STEPS: Array<{ label: string; progress: number }> = [
  { label: "Autenticando no SIGAA…", progress: 8 },
  { label: "Carregando portal do discente…", progress: 22 },
  { label: "Sincronizando turma virtual…", progress: 38 },
  { label: "Baixando notas e faltas…", progress: 52 },
];

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function startPendingSyncProgress(
  onStep: (step: SyncStep) => void
): () => void {
  let index = 0;
  onStep(PENDING_SYNC_STEPS[0]!);

  const timer = window.setInterval(() => {
    index = Math.min(index + 1, PENDING_SYNC_STEPS.length - 1);
    onStep(PENDING_SYNC_STEPS[index]!);
  }, 12_000);

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
  }, []);

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
