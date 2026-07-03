/** Escala fixa exibida nos cards e listas (independente da nota máxima do professor). */
export const SUBJECT_DISPLAY_GRADE_MAX = 100;

/** Média mínima para aprovação direta. */
export const SUBJECT_DISPLAY_PASSING_GRADE = 60;

/** Mínimo para recuperação quando os 100 pts já foram distribuídos. */
export const SUBJECT_RECOVERY_GRADE = 40;

/** Dourado Cruzeiro — nota máxima e nota perfeita. */
export const GRADE_SCORE_GOLD = "var(--gold-300)";

function lerpGradeChannel(from: number, to: number, t: number): number {
  return from + (to - from) * t;
}

function formatGradeHsl(h: number, s: number, l: number): string {
  return `hsl(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%)`;
}

/**
 * Cor da nota obtida em notificações: vermelho escuro (0%) → verde claro (~60%) →
 * verde escuro (quase máximo). Nota igual ao máximo = dourado (mesma cor do máximo).
 */
export function resolveGradeScorePercentColor(
  obtained: number,
  max: number
): string {
  if (!Number.isFinite(obtained) || max <= 0) {
    return GRADE_SCORE_GOLD;
  }

  if (obtained >= max) {
    return GRADE_SCORE_GOLD;
  }

  const ratio = Math.max(0, Math.min(1, obtained / max));

  if (ratio <= 0.6) {
    const t = ratio / 0.6;
    return formatGradeHsl(
      lerpGradeChannel(0, 120, t),
      lerpGradeChannel(68, 42, t),
      lerpGradeChannel(30, 54, t)
    );
  }

  const t = (ratio - 0.6) / 0.4;
  return formatGradeHsl(
    120,
    lerpGradeChannel(42, 58, t),
    lerpGradeChannel(54, 28, t)
  );
}

export function gradeValueColorClass(label: string): string {
  if (label === "Aprovado") return "subject-stat-value--grade-safe";
  if (label === "Risco" || label === "Recuperação") {
    return "subject-stat-value--grade-warning";
  }
  if (
    label === "Crítico" ||
    label === "Reprovado" ||
    label === "Reprovado por falta"
  ) {
    return "subject-stat-value--grade-danger";
  }
  return "";
}
