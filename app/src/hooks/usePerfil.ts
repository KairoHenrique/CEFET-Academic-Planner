"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { getPerfil, patchPerfil, SYNC_COMPLETE_EVENT } from "@/lib/api/client";
import { hydrateSubjectPrioritiesFromCloud } from "@/hooks/useStoredPriorities";
import { loadSubjectPriorities } from "@/lib/priority/storage";

export const PERFIL_QUERY_KEY = ["perfil"] as const;

export function usePerfil() {
  const queryClient = useQueryClient();
  const migratedLocalPriorities = useRef(false);

  const query = useQuery({
    queryKey: PERFIL_QUERY_KEY,
    queryFn: getPerfil,
    staleTime: 30_000,
  });

  useEffect(() => {
    const cloud = query.data?.subjectPriorities;
    if (!cloud) return;

    hydrateSubjectPrioritiesFromCloud(cloud);

    // Primeira vez: sobe prioridade só-local para a nuvem se a nuvem estiver vazia.
    if (migratedLocalPriorities.current) return;
    migratedLocalPriorities.current = true;
    if (Object.keys(cloud).length > 0) return;

    const local = loadSubjectPriorities();
    if (Object.keys(local).length === 0) return;

    void patchPerfil({ subjectPriorities: local }).catch(() => {
      migratedLocalPriorities.current = false;
    });
  }, [query.data?.subjectPriorities]);

  useEffect(() => {
    const refresh = () => {
      void queryClient.invalidateQueries({ queryKey: PERFIL_QUERY_KEY });
    };
    window.addEventListener(SYNC_COMPLETE_EVENT, refresh);
    return () => window.removeEventListener(SYNC_COMPLETE_EVENT, refresh);
  }, [queryClient]);

  return query;
}
