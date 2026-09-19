"use client";

import { useEffect, useRef } from "react";
import type { PerfilSyncStatus } from "@/lib/types/perfil-api";

/**
 * Auto-sync no client desligado por produto (set/2026):
 * sync so acontece quando o usuario clica.
 * Hook permanece montado para nao quebrar AppShell/AutoSyncRunner.
 */
export function useAutoSync(
  _syncSettings: PerfilSyncStatus | undefined,
  _startSync: (
    credentials?: undefined,
    options?: {
      mode?: "full" | "lite" | "deep" | "incremental";
      background?: boolean;
      trigger?: "auto" | "manual" | "first_login";
    }
  ) => Promise<boolean>,
  _syncing: boolean
): void {
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
  }, []);
}
