"use client";

import { useEffect, useRef } from "react";
import type { PerfilSyncStatus } from "@/lib/types/perfil-api";

function canAutoSyncNow(settings: PerfilSyncStatus): boolean {
  if (!settings.lastSyncAt) return true;

  const lastMs = Date.parse(settings.lastSyncAt);
  if (!Number.isFinite(lastMs)) return true;

  const intervalMs = settings.intervalMinutes * 60_000;
  return Date.now() - lastMs >= intervalMs;
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
      if (!canAutoSyncNow(settings)) return;
      void startSyncRef.current();
    };

    runIfDue();
    const timer = window.setInterval(runIfDue, intervalMs);
    return () => window.clearInterval(timer);
  }, [syncSettings?.intervalMinutes]);
}
