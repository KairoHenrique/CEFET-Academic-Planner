/** Escala fixa exibida nos cards e listas (independente da nota máxima do professor). */
export const SUBJECT_DISPLAY_GRADE_MAX = 100;

/** Média mínima para aprovação direta. */
export const SUBJECT_DISPLAY_PASSING_GRADE = 60;

/** Mínimo para recuperação quando os 100 pts já foram distribuídos. */
export const SUBJECT_RECOVERY_GRADE = 40;

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
