"use client";

import { useCallback, useSyncExternalStore } from "react";
import { patchPerfil } from "@/lib/api/client";
import type { PriorityLevel } from "@/lib/types/priority";
import {
  getSubjectPriority,
  getTaskPriority,
  loadSubjectPriorities,
  loadTaskPriorities,
  saveSubjectPriorities,
  saveTaskPriorities,
  subscribeSubjectPriorities,
  subscribeTaskPriorities,
} from "@/lib/priority/storage";

let cloudHydrated = false;

/** Aplica mapa vindo do GET /api/perfil (nuvem) no localStorage. */
export function hydrateSubjectPrioritiesFromCloud(
  map: Record<string, PriorityLevel> | undefined | null
): void {
  if (!map || typeof window === "undefined") return;
  // Nuvem vence em conflito; códigos só-locais permanecem até o PATCH de migração.
  saveSubjectPriorities({ ...loadSubjectPriorities(), ...map });
  cloudHydrated = true;
}

export function useSubjectPriorities() {
  const map = useSyncExternalStore(
    subscribeSubjectPriorities,
    loadSubjectPriorities,
    () => ({})
  );

  const getPriority = useCallback(
    (code: string) => getSubjectPriority(map, code),
    [map]
  );

  const setSubjectPriority = useCallback(
    (code: string, level: PriorityLevel) => {
      const next = { ...loadSubjectPriorities(), [code]: level };
      saveSubjectPriorities(next);
      void patchPerfil({ subjectPriorities: { [code]: level } }).catch(() => {
        /* offline — local já gravado */
      });
    },
    []
  );

  return {
    hydrated: typeof window !== "undefined",
    cloudHydrated,
    getPriority,
    setSubjectPriority,
    map,
  };
}

export function useTaskPriorities() {
  const map = useSyncExternalStore(
    subscribeTaskPriorities,
    loadTaskPriorities,
    () => ({})
  );

  const getPriority = useCallback(
    (taskId: number) => getTaskPriority(map, taskId),
    [map]
  );

  const setTaskPriority = useCallback(
    (taskId: number, level: PriorityLevel) => {
      saveTaskPriorities({
        ...loadTaskPriorities(),
        [String(taskId)]: level,
      });
    },
    []
  );

  return {
    hydrated: typeof window !== "undefined",
    getPriority,
    setTaskPriority,
    map,
  };
}
