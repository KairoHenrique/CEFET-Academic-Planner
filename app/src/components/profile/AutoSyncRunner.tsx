"use client";

import { usePerfil } from "@/hooks/usePerfil";
import { useAutoSync } from "@/hooks/useAutoSync";
import { useSync } from "@/hooks/useSync";

export function AutoSyncRunner() {
  const { data } = usePerfil();
  const sync = useSync();

  useAutoSync(
    data?.sync,
    data?.sync.autoEnabled ?? false,
    sync.startSync,
    sync.syncing
  );

  return null;
}
