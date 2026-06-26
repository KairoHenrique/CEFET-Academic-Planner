import type { PriorityLevel, TaskSortMode } from "@/lib/types/priority";
import {
  DEFAULT_PRIORITY,
  isPriorityLevel,
  normalizePriorityLevel,
} from "@/lib/types/priority";

const SUBJECT_KEY = "planner:subject-priorities";
const TASK_KEY = "planner:task-priorities";
const TASK_SORT_KEY = "planner:task-sort-mode";

const EMPTY_MAP: Record<string, PriorityLevel> = Object.freeze({});

const subjectListeners = new Set<() => void>();
const taskListeners = new Set<() => void>();
const sortListeners = new Set<() => void>();

interface MapCache {
  raw: string | null;
  map: Record<string, PriorityLevel>;
}

const mapCaches = new Map<string, MapCache>();

function parsePriorityMap(raw: string | null): Record<string, PriorityLevel> {
  if (!raw) return EMPTY_MAP;

  try {
    const parsed = JSON.parse(raw) as Record<string, string>;
    const next: Record<string, PriorityLevel> = {};
    for (const [id, value] of Object.entries(parsed)) {
      next[id] = isPriorityLevel(value)
        ? normalizePriorityLevel(value)
        : DEFAULT_PRIORITY;
    }
    return Object.keys(next).length > 0 ? next : EMPTY_MAP;
  } catch {
    return EMPTY_MAP;
  }
}

function readMap(key: string): Record<string, PriorityLevel> {
  if (typeof window === "undefined") return EMPTY_MAP;

  let raw: string | null;
  try {
    raw = localStorage.getItem(key);
  } catch {
    return EMPTY_MAP;
  }

  const cached = mapCaches.get(key);
  if (cached && cached.raw === raw) {
    return cached.map;
  }

  const map = parsePriorityMap(raw);
  mapCaches.set(key, { raw, map });
  return map;
}

function writeMap(
  key: string,
  map: Record<string, PriorityLevel>,
  listeners: Set<() => void>
): void {
  const serialized = JSON.stringify(map);
  localStorage.setItem(key, serialized);
  mapCaches.set(key, { raw: serialized, map });
  listeners.forEach((listener) => listener());
}

export function subscribeSubjectPriorities(listener: () => void): () => void {
  subjectListeners.add(listener);
  return () => subjectListeners.delete(listener);
}

export function subscribeTaskPriorities(listener: () => void): () => void {
  taskListeners.add(listener);
  return () => taskListeners.delete(listener);
}

export function subscribeTaskSortMode(listener: () => void): () => void {
  sortListeners.add(listener);
  return () => sortListeners.delete(listener);
}

export function loadSubjectPriorities(): Record<string, PriorityLevel> {
  return readMap(SUBJECT_KEY);
}

export function saveSubjectPriorities(
  map: Record<string, PriorityLevel>
): void {
  writeMap(SUBJECT_KEY, map, subjectListeners);
}

export function loadTaskPriorities(): Record<string, PriorityLevel> {
  return readMap(TASK_KEY);
}

export function saveTaskPriorities(map: Record<string, PriorityLevel>): void {
  writeMap(TASK_KEY, map, taskListeners);
}

export function getSubjectPriority(
  map: Record<string, PriorityLevel>,
  code: string
): PriorityLevel {
  return map[code] ?? DEFAULT_PRIORITY;
}

export function getTaskPriority(
  map: Record<string, PriorityLevel>,
  taskId: number
): PriorityLevel {
  return map[String(taskId)] ?? DEFAULT_PRIORITY;
}

export function loadTaskSortMode(): TaskSortMode {
  if (typeof window === "undefined") return "deadline_priority";
  try {
    const raw = localStorage.getItem(TASK_SORT_KEY);
    if (
      raw === "deadline_priority" ||
      raw === "priority_deadline" ||
      raw === "deadline" ||
      raw === "priority"
    ) {
      return raw;
    }
  } catch {
    /* ignore */
  }
  return "deadline_priority";
}

export function saveTaskSortMode(mode: TaskSortMode): void {
  localStorage.setItem(TASK_SORT_KEY, mode);
  sortListeners.forEach((listener) => listener());
}
