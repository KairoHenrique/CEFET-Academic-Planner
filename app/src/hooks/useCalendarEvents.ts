"use client";

import { useCallback, useEffect, useState } from "react";
import {
  calendarEvents as defaultEvents,
  type CalendarEvent,
} from "@/config/mock/calendar";

const STORAGE_KEY = "calendar-events-override";

interface StoredOverrides {
  events: CalendarEvent[];
  doneIds: string[];
}

function loadOverrides(): StoredOverrides {
  if (typeof window === "undefined") {
    return { events: [], doneIds: [] };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { events: [], doneIds: [] };
    return JSON.parse(raw) as StoredOverrides;
  } catch {
    return { events: [], doneIds: [] };
  }
}

function mergeEvents(base: CalendarEvent[], extra: CalendarEvent[], doneIds: string[]) {
  const merged = [...base, ...extra];
  return merged.map((event) => ({
    ...event,
    done: doneIds.includes(event.id) || event.done === true,
  }));
}

export function useCalendarEvents() {
  const [events, setEvents] = useState<CalendarEvent[]>(defaultEvents);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const { events: extra, doneIds } = loadOverrides();
    setEvents(mergeEvents(defaultEvents, extra, doneIds));
    setHydrated(true);
  }, []);

  const persist = useCallback((nextEvents: CalendarEvent[]) => {
    const manual = nextEvents.filter((e) => e.manual);
    const doneIds = nextEvents.filter((e) => e.done).map((e) => e.id);
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ events: manual, doneIds })
    );
  }, []);

  const toggleDone = useCallback(
    (id: string) => {
      setEvents((prev) => {
        const next = prev.map((e) =>
          e.id === id ? { ...e, done: !e.done } : e
        );
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const addManualEvent = useCallback(
    (event: Omit<CalendarEvent, "id" | "manual">) => {
      const newEvent: CalendarEvent = {
        ...event,
        id: `manual-${Date.now()}`,
        manual: true,
        done: false,
      };
      setEvents((prev) => {
        const next = [...prev, newEvent];
        persist(next);
        return next;
      });
      return newEvent;
    },
    [persist]
  );

  return { events, hydrated, toggleDone, addManualEvent };
}
