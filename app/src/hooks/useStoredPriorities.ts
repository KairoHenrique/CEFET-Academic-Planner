"use client";

import { useCallback, useSyncExternalStore } from "react";
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
      saveSubjectPriorities({ ...loadSubjectPriorities(), [code]: level });
    },
    []
  );

  return {
    hydrated: typeof window !== "undefined",
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
