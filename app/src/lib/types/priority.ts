export type PriorityLevel =
  | "high"
  | "medium_high"
  | "neutral"
  | "medium_low"
  | "low";

export const DEFAULT_PRIORITY: PriorityLevel = "neutral";

export const PRIORITY_RANK: Record<PriorityLevel, number> = {
  high: 5,
  medium_high: 4,
  neutral: 3,
  medium_low: 2,
  low: 1,
};

export const PRIORITY_ORDER: PriorityLevel[] = [
  "high",
  "medium_high",
  "neutral",
  "medium_low",
  "low",
];

export const PRIORITY_LABELS: Record<PriorityLevel, string> = {
  high: "Alta",
  medium_high: "Média-alta",
  neutral: "Neutra",
  medium_low: "Média-baixa",
  low: "Baixa",
};

export const PRIORITY_SHORT: Record<PriorityLevel, string> = {
  high: "^^",
  medium_high: "^",
  neutral: "—",
  medium_low: "v",
  low: "vv",
};

export type TaskSortMode =
  | "deadline_priority"
  | "priority_deadline"
  | "deadline"
  | "priority";

export const TASK_SORT_LABELS: Record<TaskSortMode, string> = {
  deadline_priority: "Prazo → Prioridade",
  priority_deadline: "Prioridade → Prazo",
  deadline: "Só prazo",
  priority: "Só prioridade",
};

export const TASK_SORT_MODES: TaskSortMode[] = [
  "deadline_priority",
  "priority_deadline",
  "deadline",
  "priority",
];

export const TASK_SORT_OPTIONS = Object.values(TASK_SORT_LABELS);

const LEGACY_LEVEL_MAP: Record<string, PriorityLevel> = {
  very_low: "low",
};

export function isPriorityLevel(value: string): value is PriorityLevel {
  if (PRIORITY_ORDER.includes(value as PriorityLevel)) {
    return true;
  }
  return value in LEGACY_LEVEL_MAP;
}

export function normalizePriorityLevel(value: string): PriorityLevel {
  if (PRIORITY_ORDER.includes(value as PriorityLevel)) {
    return value as PriorityLevel;
  }
  return LEGACY_LEVEL_MAP[value] ?? DEFAULT_PRIORITY;
}
