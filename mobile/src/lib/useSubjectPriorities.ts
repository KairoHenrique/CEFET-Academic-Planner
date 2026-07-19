import { useCallback, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  DEFAULT_PRIORITY,
  isPriorityLevel,
  PRIORITY_RANK,
  type PriorityLevel,
} from "./priority";

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

export function useSubjectPriorities() {
  const [map, setMap] = useState<PriorityMap>(() => memoryMap);

  useEffect(() => {
    void hydrateSubjectPriorities().then(() => setMap({ ...memoryMap }));
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
      void persist({ ...memoryMap, [code]: level });
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
