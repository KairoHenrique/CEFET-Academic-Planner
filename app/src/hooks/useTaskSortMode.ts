"use client";

import { useCallback, useSyncExternalStore } from "react";
import { TASK_SORT_LABELS, type TaskSortMode } from "@/lib/types/priority";
import {
  loadTaskSortMode,
  saveTaskSortMode,
  subscribeTaskSortMode,
} from "@/lib/priority/storage";

export function useTaskSortMode() {
  const mode = useSyncExternalStore(
    subscribeTaskSortMode,
    loadTaskSortMode,
    () => "deadline_priority" as TaskSortMode
  );

  const setSortMode = useCallback((next: TaskSortMode) => {
    saveTaskSortMode(next);
  }, []);

  const activeLabel = TASK_SORT_LABELS[mode];

  return {
    mode,
    activeLabel,
    setSortMode,
    hydrated: typeof window !== "undefined",
  };
}
