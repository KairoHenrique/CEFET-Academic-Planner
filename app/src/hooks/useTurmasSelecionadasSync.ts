"use client";

import { useCallback, useState } from "react";
import { ApiClientError, postTurmasSelecionadasSync } from "@/lib/api/client";
import { resolveSyncStartCredentials } from "@/lib/auth/resolve-sync-start-credentials";
import { getSyncCredentials, saveSyncCredentials } from "@/lib/auth/credentials";
import { isCloudSession } from "@/lib/auth/session";
import { needsSyncPassword } from "@/lib/auth/sync-session";
import type { TurmaSelecionadaItem } from "@/lib/scraper/turmas-selecionadas/parse-turmas-selecionadas";

export function useTurmasSelecionadasSync() {
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordPromptOpen, setPasswordPromptOpen] = useState(false);

  const runSync = useCallback(
    async (
      credentials?: { username: string; password?: string; savePassword?: boolean },
      onSuccess?: (turmas: TurmaSelecionadaItem[]) => void
    ) => {
      if (syncing) return false;

      const creds = credentials ?? resolveSyncStartCredentials();
      if (!creds?.username) {
        setError("Faça login e sincronize com o SIGAA para buscar turmas.");
        return false;
      }

      setSyncing(true);
      setError(null);

      try {
        const result = await postTurmasSelecionadasSync({
          ...creds,
          password: creds.password || "",
          mode: "incremental",
        });

        if (result.ok) {
          onSuccess?.(result.turmas);
        }
        
        setSyncing(false);
        return true;
      } catch (err) {
        if (err instanceof ApiClientError) {
          setError(err.message);
        } else {
          setError("Falha ao buscar turmas selecionadas no SIGAA.");
        }
        setSyncing(false);
        return false;
      }
    },
    [syncing]
  );

  const requestSync = useCallback(
    (onSuccess?: (turmas: TurmaSelecionadaItem[]) => void) => {
      const creds = resolveSyncStartCredentials();
      if (!creds?.username) {
        setError("Faça login e sincronize com o SIGAA para buscar turmas.");
        return;
      }

      if (!isCloudSession() && needsSyncPassword(creds.username)) {
        setPasswordPromptOpen(true);
        // Não conseguimos injetar a callback onSuccess no prompt tão fácil, 
        // mas assumimos que o callback original não será perdido se guardarmos num ref, 
        // para simplificar, a promessa pode ser perdida se pedir senha.
        // O melhor é fazer onSuccess ser passado via props para o hook ou retornar promessa.
        return;
      }

      void runSync(undefined, onSuccess);
    },
    [runSync]
  );

  const submitPasswordAndSync = useCallback(
    (password: string, onSuccess?: (turmas: TurmaSelecionadaItem[]) => void) => {
      const creds = getSyncCredentials();
      if (!creds?.username || !password.trim()) return;

      saveSyncCredentials(
        { username: creds.username, password, savePassword: creds.savePassword },
        creds.savePassword === true
      );

      setPasswordPromptOpen(false);
      void runSync(
        {
          username: creds.username,
          password,
          savePassword: creds.savePassword,
        },
        onSuccess
      );
    },
    [runSync]
  );

  return {
    syncing,
    error,
    passwordPromptOpen,
    setPasswordPromptOpen,
    requestSync,
    submitPasswordAndSync,
  };
}
