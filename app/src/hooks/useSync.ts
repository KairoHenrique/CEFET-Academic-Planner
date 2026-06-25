"use client";

import { useCallback, useState } from "react";

export interface SyncStep {
  label: string;
  progress: number;
}

const SYNC_STEPS: SyncStep[] = [
  { label: "Autenticando no SIGAA…", progress: 15 },
  { label: "Carregando portal do discente…", progress: 35 },
  { label: "Sincronizando disciplinas…", progress: 55 },
  { label: "Baixando notas e faltas…", progress: 75 },
  { label: "Atualizando calendário…", progress: 90 },
  { label: "Concluído", progress: 100 },
];

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function useSync() {
  const [syncing, setSyncing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stepLabel, setStepLabel] = useState("");
  const [error, setError] = useState<string | null>(null);

  const startSync = useCallback(
    async (options?: { simulateError?: "credentials" | "offline" }) => {
      setSyncing(true);
      setError(null);
      setProgress(0);

      try {
        for (const step of SYNC_STEPS) {
          setStepLabel(step.label);
          setProgress(step.progress);
          await delay(500);

          if (options?.simulateError === "credentials" && step.progress === 15) {
            throw new Error("credentials");
          }
          if (options?.simulateError === "offline" && step.progress === 35) {
            throw new Error("offline");
          }
        }
      } catch (err) {
        const code = err instanceof Error ? err.message : "unknown";
        if (code === "credentials") {
          setError("Usuário ou senha inválidos. Verifique suas credenciais do SIGAA.");
        } else if (code === "offline") {
          setError("SIGAA indisponível no momento. Tente novamente mais tarde.");
        } else {
          setError("Falha na sincronização. Tente novamente.");
        }
        setSyncing(false);
        return false;
      }

      setSyncing(false);
      return true;
    },
    []
  );

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
