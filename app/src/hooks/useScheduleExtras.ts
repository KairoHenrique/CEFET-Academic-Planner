"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  cloneSchedule,
  weeklySchedule,
  type ScheduleSlotData,
} from "@/config/mock/schedule";

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
  const [extras, setExtras] = useState<Record<string, ExtraScheduleSlot>>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setExtras(loadExtras());
    setHydrated(true);
  }, []);

  const mergedSchedule = useMemo(() => {
    const base = cloneSchedule(weeklySchedule);
    Object.entries(extras).forEach(([key, slot]) => {
      const [dayIdx, slotIdx] = key.split("-").map(Number);
      if (!base[dayIdx]?.[slotIdx]) {
        base[dayIdx][slotIdx] = { ...slot, code: "EXTRA" };
      }
    });
    return base;
  }, [extras]);

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

  return {
    hydrated,
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
