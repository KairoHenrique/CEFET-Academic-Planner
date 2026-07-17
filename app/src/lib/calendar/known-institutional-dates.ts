import type { CalendarioAcademicoRow } from "@/lib/types/db";

/**
 * Datas institucionais divulgadas pelo CEFET por fora do SIGAA (o calendário
 * oficial ainda mostra "Não Definido"). Funcionam como fallback: se o SIGAA
 * publicar a data real (mesmo evento + semestre), o registro raspado tem
 * prioridade e o fallback é descartado — evitando duplicidade.
 *
 * Os rótulos usam o nome bruto do SIGAA (ex.: "Processamento de Matrícula"),
 * pois a renomeação para exibição acontece em `formatInstitutionalEventLabel`
 * (→ "Resultado Matrícula Fase 1/2").
 */
interface KnownInstitutionalDate {
  evento: string;
  semestre: string;
  dataInicio: string;
  dataFim?: string;
}

const KNOWN_INSTITUTIONAL_DATES: KnownInstitutionalDate[] = [
  // 2026.2 — resultados das matrículas (SIGAA "Não Definido" em 17/07/2026).
  {
    evento: "Processamento de Matrícula",
    semestre: "2026.2",
    dataInicio: "2026-07-29",
  },
  {
    evento: "Processamento de Rematrícula",
    semestre: "2026.2",
    dataInicio: "2026-08-04",
  },
];

/** Id sintético alto p/ não colidir com o autoincrement do banco. */
const SYNTHETIC_ID_BASE = 900_000;

function normalizeKey(
  evento: string,
  semestre: string | null | undefined
): string {
  const normalizedEvento = evento
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/:$/, "")
    .trim();
  return `${normalizedEvento}::${(semestre ?? "").trim()}`;
}

/** Acrescenta datas conhecidas que o SIGAA ainda não publicou (sem duplicar). */
export function mergeKnownInstitutionalDates(
  rows: CalendarioAcademicoRow[]
): CalendarioAcademicoRow[] {
  const existing = new Set(
    rows.map((row) => normalizeKey(row.evento, row.semestre))
  );

  const supplements: CalendarioAcademicoRow[] = [];
  KNOWN_INSTITUTIONAL_DATES.forEach((known, index) => {
    if (existing.has(normalizeKey(known.evento, known.semestre))) return;
    supplements.push({
      id: SYNTHETIC_ID_BASE + index,
      evento: known.evento,
      data_inicio: known.dataInicio,
      data_fim: known.dataFim ?? null,
      semestre: known.semestre,
    });
  });

  return supplements.length > 0 ? [...rows, ...supplements] : rows;
}
