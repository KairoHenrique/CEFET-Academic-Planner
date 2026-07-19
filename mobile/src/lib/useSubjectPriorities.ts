import { useCallback, useEffect, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { PriorityLevel } from "./priority";
import {
  DEFAULT_PRIORITY,
  isPriorityLevel,
  PRIORITY_RANK,
} from "./priority";
import { getPerfil, requestJson } from "../auth/api";
import type { PerfilResponse } from "@acme/api-contracts";

const STORAGE_KEY = "acme-hub.subject-priorities";

type PriorityMap = Record<string, PriorityLevel>;

let memoryMap: PriorityMap = {};
const listeners = new Set<() => void>();

function notify() {
  for (const l of listeners) l();
}

async function persist(map: PriorityMap) {
  memoryMap = map;
  notify();
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

export async function hydrateSubjectPriorities(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const next: PriorityMap = {};
    for (const [code, value] of Object.entries(parsed)) {
      if (typeof value === "string" && isPriorityLevel(value)) {
        next[code] = value;
      }
    }
    memoryMap = next;
    notify();
  } catch {
    /* ignore */
  }
}

export async function hydrateSubjectPrioritiesFromCloud(
  map: Record<string, PriorityLevel> | undefined | null
): Promise<void> {
  if (!map) return;
  const next: PriorityMap = { ...memoryMap };
  for (const [code, level] of Object.entries(map)) {
    if (isPriorityLevel(level)) next[code] = level;
  }
  await persist(next);
}

/** Busca GET /api/perfil e aplica subjectPriorities; migra local→nuvem se vazia. */
export async function syncSubjectPrioritiesFromApi(): Promise<void> {
  try {
    const perfil = await getPerfil();
    const cloud = perfil.subjectPriorities ?? {};
    await hydrateSubjectPrioritiesFromCloud(cloud);

    if (Object.keys(cloud).length > 0) return;
    if (Object.keys(memoryMap).length === 0) return;

    await requestJson<PerfilResponse>("/api/perfil", {
      method: "PATCH",
      body: JSON.stringify({ subjectPriorities: memoryMap }),
    });
  } catch {
    /* offline */
  }
}

export function useSubjectPriorities() {
  const [map, setMap] = useState<PriorityMap>(() => memoryMap);
  const syncedOnce = useRef(false);

  useEffect(() => {
    void hydrateSubjectPriorities().then(() => setMap({ ...memoryMap }));
    if (!syncedOnce.current) {
      syncedOnce.current = true;
      void syncSubjectPrioritiesFromApi().then(() => setMap({ ...memoryMap }));
    }
    const onChange = () => setMap({ ...memoryMap });
    listeners.add(onChange);
    return () => {
      listeners.delete(onChange);
    };
  }, []);

  const getPriority = useCallback(
    (code: string): PriorityLevel => map[code] ?? DEFAULT_PRIORITY,
    [map]
  );

  const setSubjectPriority = useCallback(
    (code: string, level: PriorityLevel) => {
      const next = { ...memoryMap, [code]: level };
      void persist(next);
      void requestJson<PerfilResponse>("/api/perfil", {
        method: "PATCH",
        body: JSON.stringify({ subjectPriorities: { [code]: level } }),
      }).catch(() => {
        /* offline — local já gravado */
      });
    },
    []
  );

  const sortByPriority = useCallback(
    <T extends { code: string }>(items: T[]): T[] => {
      return [...items].sort((a, b) => {
        const ra = PRIORITY_RANK[getPriority(a.code)];
        const rb = PRIORITY_RANK[getPriority(b.code)];
        return rb - ra;
      });
    },
    [getPriority]
  );

  return { getPriority, setSubjectPriority, sortByPriority, map };
}
