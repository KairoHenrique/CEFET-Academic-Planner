import { formatGradePoints } from "@/lib/disciplinas/grade-input";

export function buildGradeNotificationSubtitle(
  disciplinaNome: string,
  notaObtida: number,
  notaMaxima: number | null
): string {
  const obtida = formatGradePoints(notaObtida);

  if (notaMaxima === null || notaMaxima <= 0) {
    return `${disciplinaNome} · nota ${obtida}`;
  }

  const maxima = formatGradePoints(notaMaxima);
  return `${disciplinaNome} · ${obtida} / ${maxima}`;
}
