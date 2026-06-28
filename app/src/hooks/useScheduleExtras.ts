"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  cloneSchedule,
  weeklySchedule,
  type ScheduleSlotData,
} from "@/config/mock/schedule";
import { useDisciplinas } from "@/hooks/useDisciplinas";
import type { SubjectListItem } from "@/lib/types/disciplinas-api";

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

function applySubjectOverlay(
  grid: ReturnType<typeof cloneSchedule>,
  subjectByCode: Record<string, SubjectListItem>
) {
  grid.forEach((row) => {
    row.forEach((slot, slotIdx) => {
      if (!slot?.code) return;
      const subject = subjectByCode[slot.code];
      if (!subject) return;
      row[slotIdx] = {
        ...slot,
        color: subject.color,
        name: subject.shortLabel,
      };
    });
  });
}

export function useScheduleExtras() {
  const { items: subjects } = useDisciplinas();
  const [extras, setExtras] = useState<Record<string, ExtraScheduleSlot>>({});
  const [hydrated, setHydrated] = useState(false);

  const subjectByCode = useMemo(
    () => Object.fromEntries(subjects.map((subject) => [subject.code, subject])),
    [subjects]
  );

  useEffect(() => {
    setExtras(loadExtras());
    setHydrated(true);
  }, []);

  const mergedSchedule = useMemo(() => {
    const base = cloneSchedule(weeklySchedule);
    applySubjectOverlay(base, subjectByCode);
    Object.entries(extras).forEach(([key, slot]) => {
      const [dayIdx, slotIdx] = key.split("-").map(Number);
      if (!base[dayIdx]?.[slotIdx]) {
        base[dayIdx][slotIdx] = { ...slot, code: "EXTRA" };
      }
    });
    return base;
  }, [extras, subjectByCode]);

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
