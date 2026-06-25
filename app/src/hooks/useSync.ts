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

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
      const result = await postSync(creds);

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
