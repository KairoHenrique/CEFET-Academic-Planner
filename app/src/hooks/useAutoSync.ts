"use client";

import { useEffect, useRef } from "react";
import { getSyncCredentials } from "@/lib/auth/credentials";
import { consumeBackgroundSyncPending } from "@/lib/auth/background-sync";
import { needsSyncPassword } from "@/lib/auth/sync-session";
import type { PerfilSyncStatus } from "@/lib/types/perfil-api";

function canAutoSyncNow(settings: PerfilSyncStatus): boolean {
  if (!settings.lastSyncAt) return false;

  const lastMs = Date.parse(settings.lastSyncAt);
  if (!Number.isFinite(lastMs)) return false;

  const intervalMs = settings.intervalMinutes * 60_000;
  return Date.now() - lastMs >= intervalMs;
}

/** Agenda auto-sync no client; execução real via fila B55 (`startSync` → `POST /api/sync/queue`). */
export function useAutoSync(
  syncSettings: PerfilSyncStatus | undefined,
  startSync: (
    credentials?: undefined,
    options?: {
      mode?: "full" | "incremental";
      background?: boolean;
      trigger?: "auto" | "manual" | "first_login";
    }
  ) => Promise<boolean>,
  syncing: boolean
): void {
  const startSyncRef = useRef(startSync);
  const settingsRef = useRef(syncSettings);
  const syncingRef = useRef(syncing);
  const entrySyncDoneRef = useRef(false);

  startSyncRef.current = startSync;
  settingsRef.current = syncSettings;
  syncingRef.current = syncing;

  useEffect(() => {
    if (!syncSettings || entrySyncDoneRef.current) return;

    const creds = getSyncCredentials();
    if (!creds?.username || needsSyncPassword(creds.username)) return;

    if (consumeBackgroundSyncPending()) {
      entrySyncDoneRef.current = true;
      void startSyncRef.current(undefined, {
        mode: "incremental",
        background: true,
        trigger: "auto",
      });
    }
  }, [syncSettings]);

  useEffect(() => {
    if (!syncSettings?.lastSyncAt) return;

    const intervalMs = syncSettings.intervalMinutes * 60_000;

    const runIfDue = () => {
      const settings = settingsRef.current;
      if (!settings || syncingRef.current) return;
      if (!canAutoSyncNow(settings)) return;

      const creds = getSyncCredentials();
      if (!creds?.username || needsSyncPassword(creds.username)) return;

      void startSyncRef.current(undefined, {
        mode: "incremental",
        background: true,
        trigger: "auto",
      });
    };

    const timer = window.setInterval(runIfDue, intervalMs);
    return () => window.clearInterval(timer);
  }, [syncSettings?.lastSyncAt, syncSettings?.intervalMinutes]);
}
