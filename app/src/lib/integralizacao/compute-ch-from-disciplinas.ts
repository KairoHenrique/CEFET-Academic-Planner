import { isHistoricoApproved, isHistoricoCursando } from "@/lib/mapa/course-status";
import type { ChType } from "@/lib/integralizacao/ch-catalog";
import { CH_TYPES } from "@/lib/integralizacao/ch-catalog";
import { mapDisciplineTipoToChType } from "@/lib/integralizacao/map-discipline-tipo-to-ch";
import type { DisciplinaRow, HistoricoRow } from "@/lib/types/db";

function normalizeCode(code: string): string {
  return code.trim().toUpperCase();
}

function emptyChTotals(): Record<ChType, number> {
  return CH_TYPES.reduce(
    (acc, tipo) => {
      acc[tipo] = 0;
      return acc;
    },
    {} as Record<ChType, number>
  );
}

/** Soma CH concluída/cursando a partir do histórico + semestre atual. */
export function computeChDoneFromDisciplinas(
  disciplinas: DisciplinaRow[],
  historico: HistoricoRow[],
  semestreAtualCodes: string[]
): Record<ChType, number> {
  const byCode = new Map(
    disciplinas.map((disciplina) => [normalizeCode(disciplina.codigo), disciplina])
  );
  const totals = emptyChTotals();
  const counted = new Set<string>();

  const addDisciplina = (code: string) => {
    const key = normalizeCode(code);
    if (counted.has(key)) return;

    const disciplina = byCode.get(key);
    if (!disciplina) return;

    counted.add(key);
    const chType = mapDisciplineTipoToChType(disciplina.tipo);
    totals[chType] += disciplina.carga_horaria ?? 0;
  };

  for (const row of historico) {
    if (isHistoricoApproved(row) || isHistoricoCursando(row)) {
      addDisciplina(row.disciplina_id);
    }
  }

  for (const code of semestreAtualCodes) {
    addDisciplina(code);
  }

  return totals;
}
