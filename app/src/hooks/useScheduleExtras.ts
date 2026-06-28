"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  cloneSchedule,
  createEmptySchedule,
  type ScheduleSlotData,
} from "@/config/mock/schedule";
import { useSchedule } from "@/hooks/useSchedule";

const STORAGE_KEY = "schedule-extras";

export type ExtraSlotType = "monitoria" | "estagio" | "estudo" | "outro";

export interface ExtraScheduleSlot extends ScheduleSlotData {
  extraType: ExtraSlotType;
}

function loadExtras(): Record<string, ExtraScheduleSlot> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, ExtraScheduleSlot>) : {};
  } catch {
    return {};
  }
}

function slotKey(dayIdx: number, slotIdx: number) {
  return `${dayIdx}-${slotIdx}`;
}

export function useScheduleExtras() {
  const scheduleQuery = useSchedule();
  const [extras, setExtras] = useState<Record<string, ExtraScheduleSlot>>({});
  const [extrasHydrated, setExtrasHydrated] = useState(false);

  useEffect(() => {
    setExtras(loadExtras());
    setExtrasHydrated(true);
  }, []);

  const mergedSchedule = useMemo(() => {
    const base = scheduleQuery.data
      ? cloneSchedule(scheduleQuery.data.grid)
      : createEmptySchedule();

    Object.entries(extras).forEach(([key, slot]) => {
      const [dayIdx, slotIdx] = key.split("-").map(Number);
      if (!base[dayIdx]?.[slotIdx]) {
        base[dayIdx][slotIdx] = { ...slot, code: "EXTRA" };
      }
    });

    return base;
  }, [scheduleQuery.data, extras]);

  const addExtra = useCallback(
    (dayIdx: number, slotIdx: number, slot: ExtraScheduleSlot) => {
      const key = slotKey(dayIdx, slotIdx);
      setExtras((prev) => {
        const next = { ...prev, [key]: slot };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        return next;
      });
    },
    []
  );

  const removeExtra = useCallback((dayIdx: number, slotIdx: number) => {
    const key = slotKey(dayIdx, slotIdx);
    setExtras((prev) => {
      const next = { ...prev };
      delete next[key];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const isExtra = useCallback(
    (dayIdx: number, slotIdx: number) => Boolean(extras[slotKey(dayIdx, slotIdx)]),
    [extras]
  );

  const hydrated = extrasHydrated && !scheduleQuery.loading;

  return {
    hydrated,
    loading: scheduleQuery.loading || !extrasHydrated,
    error: scheduleQuery.error,
    needsSync: scheduleQuery.needsSync,
    refetch: scheduleQuery.refetch,
    mergedSchedule,
    addExtra,
    removeExtra,
    isExtra,
  };
}

export function getExtraTypeLabel(type: ExtraSlotType): string {
  const labels: Record<ExtraSlotType, string> = {
    monitoria: "Monitoria",
    estagio: "Estágio",
    estudo: "Estudo",
    outro: "Outro",
  };
  return labels[type];
}
