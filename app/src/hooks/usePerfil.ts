"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { getPerfil, SYNC_COMPLETE_EVENT } from "@/lib/api/client";

export const PERFIL_QUERY_KEY = ["perfil"] as const;

export function usePerfil() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: PERFIL_QUERY_KEY,
    queryFn: getPerfil,
    staleTime: 30_000,
  });

  useEffect(() => {
    const refresh = () => {
      void queryClient.invalidateQueries({ queryKey: PERFIL_QUERY_KEY });
    };
    window.addEventListener(SYNC_COMPLETE_EVENT, refresh);
    return () => window.removeEventListener(SYNC_COMPLETE_EVENT, refresh);
  }, [queryClient]);

  return query;
}
