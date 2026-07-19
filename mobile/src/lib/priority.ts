export type PriorityLevel =
  | "high"
  | "medium_high"
  | "neutral"
  | "medium_low"
  | "low";

export const DEFAULT_PRIORITY: PriorityLevel = "neutral";

export const PRIORITY_ORDER: PriorityLevel[] = [
  "high",
  "medium_high",
  "neutral",
  "medium_low",
  "low",
];

export const PRIORITY_RANK: Record<PriorityLevel, number> = {
  high: 5,
  medium_high: 4,
  neutral: 3,
  medium_low: 2,
  low: 1,
};

export const PRIORITY_LABELS: Record<PriorityLevel, string> = {
  high: "Alta",
  medium_high: "Média-alta",
  neutral: "Neutra",
  medium_low: "Média-baixa",
  low: "Baixa",
};

/** Glifos no estilo dos ícones do site. */
export const PRIORITY_GLYPH: Record<PriorityLevel, string> = {
  high: "⇈",
  medium_high: "↑",
  neutral: "−",
  medium_low: "↓",
  low: "⇊",
};

export const PRIORITY_COLOR: Record<PriorityLevel, string> = {
  high: "#e85d55",
  medium_high: "#e85d55",
  neutral: "#8b9cb0",
  medium_low: "#5eb0f0",
  low: "#5eb0f0",
};

export function isPriorityLevel(value: string): value is PriorityLevel {
  return PRIORITY_ORDER.includes(value as PriorityLevel);
}
