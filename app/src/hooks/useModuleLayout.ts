"use client";

import { useCallback, useEffect, useState } from "react";

export interface ModuleDefinition {
  id: string;
  label: string;
  colClass: string;
}

interface StoredLayout {
  order: string[];
  hidden: string[];
}

function loadLayout(pageId: string, defaults: ModuleDefinition[]): StoredLayout {
  if (typeof window === "undefined") {
    return { order: defaults.map((m) => m.id), hidden: [] };
  }

  try {
    const raw = localStorage.getItem(`module-layout:${pageId}`);
    if (!raw) return { order: defaults.map((m) => m.id), hidden: [] };
    const parsed = JSON.parse(raw) as StoredLayout;
    const validIds = new Set(defaults.map((m) => m.id));
    const order = parsed.order.filter((id) => validIds.has(id));
    defaults.forEach((m) => {
      if (!order.includes(m.id)) order.push(m.id);
    });
    return {
      order,
      hidden: parsed.hidden.filter((id) => validIds.has(id)),
    };
  } catch {
    return { order: defaults.map((m) => m.id), hidden: [] };
  }
}

export function useModuleLayout(pageId: string, defaults: ModuleDefinition[]) {
  const defaultIds = defaults.map((m) => m.id).join(",");
  const [order, setOrder] = useState<string[]>(() =>
    defaults.map((m) => m.id)
  );
  const [hidden, setHidden] = useState<string[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = loadLayout(pageId, defaults);
    setOrder(stored.order);
    setHidden(stored.hidden);
    setHydrated(true);
  }, [pageId, defaultIds, defaults]);

  const persist = useCallback(
    (nextOrder: string[], nextHidden: string[]) => {
      localStorage.setItem(
        `module-layout:${pageId}`,
        JSON.stringify({ order: nextOrder, hidden: nextHidden })
      );
    },
    [pageId]
  );

  const moveModule = (id: string, direction: -1 | 1) => {
    setOrder((prev) => {
      const idx = prev.indexOf(id);
      const target = idx + direction;
      if (idx < 0 || target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[target]] = [next[target], next[idx]];
      persist(next, hidden);
      return next;
    });
  };

  const reorderModule = (sourceId: string, targetId: string) => {
    if (sourceId === targetId) return;
    setOrder((prev) => {
      const from = prev.indexOf(sourceId);
      const to = prev.indexOf(targetId);
      if (from < 0 || to < 0) return prev;
      const next = [...prev];
      next.splice(from, 1);
      next.splice(to, 0, sourceId);
      persist(next, hidden);
      return next;
    });
  };

  const toggleModule = (id: string) => {
    setHidden((prev) => {
      const next = prev.includes(id)
        ? prev.filter((h) => h !== id)
        : [...prev, id];
      persist(order, next);
      return next;
    });
  };

  const resetLayout = () => {
    const defaultOrder = defaults.map((m) => m.id);
    setOrder(defaultOrder);
    setHidden([]);
    persist(defaultOrder, []);
  };

  return {
    hydrated,
    editMode,
    setEditMode,
    order,
    hidden,
    moveModule,
    reorderModule,
    toggleModule,
    resetLayout,
    allModules: defaults,
  };
}
