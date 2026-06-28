"use client";

import { useEffect, useRef } from "react";
import type { PerfilSyncStatus } from "@/lib/types/perfil-api";

function canSyncNow(settings: PerfilSyncStatus): boolean {
  if (settings.nextAllowedAt) {
    return Date.parse(settings.nextAllowedAt) <= Date.now();
  }
  return settings.remainingSeconds <= 0;
}

export function useAutoSync(
  syncSettings: PerfilSyncStatus | undefined,
  startSync: () => Promise<boolean>,
  syncing: boolean
): void {
  const startSyncRef = useRef(startSync);
  const settingsRef = useRef(syncSettings);
  const syncingRef = useRef(syncing);

  startSyncRef.current = startSync;
  settingsRef.current = syncSettings;
  syncingRef.current = syncing;

  useEffect(() => {
    if (!syncSettings) return;

    const intervalMs = syncSettings.intervalMinutes * 60_000;

    const runIfDue = () => {
      const settings = settingsRef.current;
      if (!settings || syncingRef.current) return;
      if (!canSyncNow(settings)) return;
      void startSyncRef.current();
    };

    runIfDue();
    const timer = window.setInterval(runIfDue, intervalMs);
    return () => window.clearInterval(timer);
  }, [syncSettings?.intervalMinutes]);
}
