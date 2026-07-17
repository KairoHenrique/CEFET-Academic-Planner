import { getNotasByDisciplina } from "@/lib/db/queries";
import { roundFinalGradeTotal } from "@/lib/disciplinas/grade-rounding";
import type { NotaRow } from "@/lib/types/db";

/** Núcleo puro — agnóstico de backend (recebe as notas já carregadas). */
export function computeGradeFromNotas(notas: NotaRow[]): number | null {
  if (notas.length === 0) return null;

  const hasScore = notas.some((nota) => nota.nota_obtida !== null);
  if (!hasScore) return null;

  const total = notas.reduce((acc, nota) => acc + (nota.nota_obtida ?? 0), 0);
  return roundFinalGradeTotal(total);
}

export function computeGrade(disciplinaId: string): number | null {
  return computeGradeFromNotas(getNotasByDisciplina(disciplinaId));
}
