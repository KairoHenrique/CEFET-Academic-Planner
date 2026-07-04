"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { clearSession } from "@/lib/auth/session";
import { getSyncCredentials } from "@/lib/auth/credentials";
import {
  isSilentBackgroundSyncError,
  mapQueuedSyncError,
  runQueuedSyncClient,
  shouldLogoutOnBackgroundSyncError,
} from "@/lib/sync-queue/run-queued-sync-client";
import type { SyncMode, SyncRequest, SyncStep } from "@/lib/types/sync";
import type {
  SyncJobTrigger,
  SyncQueueJobView,
} from "@/lib/types/sync-queue-api";

export interface StartSyncOptions {
  mode?: SyncMode;
  /** Não bloqueia a UI com painel de progresso (sync em background). */
  background?: boolean;
  trigger?: SyncJobTrigger;
}

interface SyncQueueContextValue {
  syncing: boolean;
  progress: number;
  stepLabel: string;
  error: string | null;
  activeJob: SyncQueueJobView | null;
  startSync: (
    credentials?: SyncRequest,
    options?: StartSyncOptions
  ) => Promise<boolean>;
  resetError: () => void;
}

const SyncQueueContext = createContext<SyncQueueContextValue | null>(null);

function resolveTrigger(
  options: StartSyncOptions,
  background: boolean
): SyncJobTrigger {
  if (options.trigger) return options.trigger;
  return background ? "auto" : "manual";
}

export function SyncQueueProvider({ children }: { children: ReactNode }) {
  const [syncing, setSyncing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stepLabel, setStepLabel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [activeJob, setActiveJob] = useState<SyncQueueJobView | null>(null);
  const syncingRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

  const startSync = useCallback(
    async (credentials?: SyncRequest, options: StartSyncOptions = {}) => {
      if (syncingRef.current) {
        return false;
      }

      const creds = credentials ?? getSyncCredentials();
      if (!creds) {
        setError("Credenciais não encontradas. Faça login novamente.");
        return false;
      }

      const mode = options.mode ?? creds.mode ?? "full";
      const background = options.background === true;
      const trigger = resolveTrigger(options, background);

      syncingRef.current = true;
      abortRef.current?.abort();
      abortRef.current = new AbortController();

      setSyncing(true);
      setActiveJob(null);

      if (!background) {
        setError(null);
        setProgress(0);
        setStepLabel("Iniciando sincronização…");
      } else {
        setError(null);
      }

      const onUiStep = (step: SyncStep) => {
        setStepLabel(step.label);
        setProgress(step.progress);
      };

      try {
        await runQueuedSyncClient({
          creds,
          mode,
          trigger,
          background,
          onJobUpdate: setActiveJob,
          onUiStep,
          signal: abortRef.current.signal,
        });

        syncingRef.current = false;
        setSyncing(false);
        setActiveJob(null);
        return true;
      } catch (err) {
        if (isSilentBackgroundSyncError(err, background)) {
          syncingRef.current = false;
          setSyncing(false);
          setActiveJob(null);
          return false;
        }

        if (background && shouldLogoutOnBackgroundSyncError(err)) {
          clearSession();
          const params = new URLSearchParams({ error: "credentials" });
          window.location.assign(`/login?${params.toString()}`);
        }

        setError(mapQueuedSyncError(err));
        syncingRef.current = false;
        setSyncing(false);
        setActiveJob(null);
        return false;
      }
    },
    []
  );

  const resetError = useCallback(() => setError(null), []);

  const value = useMemo<SyncQueueContextValue>(
    () => ({
      syncing,
      progress,
      stepLabel,
      error,
      activeJob,
      startSync,
      resetError,
    }),
    [syncing, progress, stepLabel, error, activeJob, startSync, resetError]
  );

  return (
    <SyncQueueContext.Provider value={value}>
      {children}
    </SyncQueueContext.Provider>
  );
}

export function useSyncQueueContext(): SyncQueueContextValue {
  const context = useContext(SyncQueueContext);
  if (!context) {
    throw new Error("useSyncQueueContext must be used within SyncQueueProvider");
  }
  return context;
}

export type { SyncStep };
