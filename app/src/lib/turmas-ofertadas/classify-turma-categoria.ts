import { mapDisciplineTipoToChType } from "@/lib/integralizacao/map-discipline-tipo-to-ch";
import type { DisciplinaRow } from "@/lib/types/db";

export type TurmaOfertadaCategoria = "curso" | "optativa";

/**
 * Simulador: só obrigatórias do mapa/PPC vão para "Disciplinas do curso".
 * Tudo que não casar ou não for Obrigatória → Optativas.
 */
export function classifyTurmaCategoria(
  disciplina: DisciplinaRow | undefined
): TurmaOfertadaCategoria {
  if (!disciplina) return "optativa";

  return mapDisciplineTipoToChType(disciplina.tipo) === "Obrigatória"
    ? "curso"
    : "optativa";
}
