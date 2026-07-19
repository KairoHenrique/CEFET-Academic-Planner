import { formatGradePoints } from "@/lib/disciplinas/grade-input";

export function buildGradeNotificationSubtitle(
  disciplinaNome: string,
  notaObtida: number,
  notaMaxima: number | null,
  avaliacaoNome: string
): string {
  const obtida = formatGradePoints(notaObtida);

  // Lógica de aprovação para nota final
  if (
    avaliacaoNome.toLowerCase().includes("final") ||
    avaliacaoNome.toLowerCase().includes("média")
  ) {
    // Se a nota máxima for 100, consideramos 60 como aprovação. Se for 10, consideramos 6.0.
    const isApproved =
      notaMaxima && notaMaxima >= 100 ? notaObtida >= 59.5 : notaObtida >= 5.95;

    if (isApproved) {
      return `Nota final: ${obtida}. Parabéns, você passou!`;
    }
  }

  if (notaMaxima === null || notaMaxima <= 0) {
    return `${disciplinaNome} · Nota ${obtida}`;
  }

  const maxima = formatGradePoints(notaMaxima);
  return `${disciplinaNome} · Nota ${obtida} / ${maxima}`;
}
