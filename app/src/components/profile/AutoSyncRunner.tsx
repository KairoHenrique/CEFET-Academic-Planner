"use client";

import { usePerfil } from "@/hooks/usePerfil";
import { useAutoSync } from "@/hooks/useAutoSync";
import { useSync } from "@/hooks/useSync";

/** Sync automático da plataforma — sempre ativo enquanto o aluno está logado. */
export function AutoSyncRunner() {
  const { data } = usePerfil();
  const sync = useSync();

  useAutoSync(data?.sync, sync.startSync, sync.syncing);

  return null;
}
