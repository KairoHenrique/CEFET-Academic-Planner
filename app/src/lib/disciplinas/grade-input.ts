import type { SubjectEvaluation } from "@/lib/types/subject";
import { SUBJECT_DISPLAY_GRADE_MAX } from "@/lib/disciplinas/grade-display";

function normalizeScoreForParse(value: string): string {
  return value.trim().replace(",", ".");
}

export function parseScoreInput(value: string): number | null {
  const trimmed = normalizeScoreForParse(value);
  if (!trimmed || trimmed === ".") return null;
  const parsed = parseFloat(trimmed);
  return Number.isNaN(parsed) ? null : parsed;
}

export function sanitizeScoreInput(value: string): string {
  const withoutMinus = value.replace(/-/g, "");
  let result = "";
  let hasSeparator = false;

  for (const char of withoutMinus) {
    if (char >= "0" && char <= "9") {
      result += char;
    } else if ((char === "." || char === ",") && !hasSeparator) {
      hasSeparator = true;
      result += char;
    }
  }

  return result;
}

export function clampScoreDraft(value: string, max: number): string {
  const trimmed = value.trim();
  if (!trimmed || trimmed === "." || trimmed === ",") return "";

  const parsed = parseScoreInput(trimmed);
  if (parsed === null) return "";

  if (parsed > max) return String(max);
  if (parsed < 0) return "0";
  return trimmed;
}

export function computeScoreUpperLimit(
  row: SubjectEvaluation,
  evaluations: SubjectEvaluation[],
  gradeMax: number = SUBJECT_DISPLAY_GRADE_MAX
): number {
  if (!row.extra) return row.max;

  const othersTotal = evaluations.reduce((acc, ev) => {
    if (ev.id === row.id) return acc;
    return acc + (ev.score ?? 0);
  }, 0);

  return Math.max(0, gradeMax - othersTotal);
}

export function clampEvaluationScoreDraft(
  value: string,
  row: SubjectEvaluation,
  evaluations: SubjectEvaluation[],
  gradeMax: number = SUBJECT_DISPLAY_GRADE_MAX
): string {
  const upper = computeScoreUpperLimit(row, evaluations, gradeMax);
  return clampScoreDraft(value, upper);
}

export function clampEvaluationMaxDraft(value: string, budget: number): string {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;

  const parsed = parseFloat(trimmed.replace(",", "."));
  if (Number.isNaN(parsed)) return trimmed;
  if (parsed <= 0) return trimmed;
  if (parsed > budget) return String(budget);
  return trimmed;
}

export function formatGradePoints(value: number): string {
  return value % 1 === 0 ? String(value) : value.toFixed(1);
}
