import type { TurmaVirtualDisciplinaSnapshot } from "@/lib/scraper/types/turma-virtual";

const SCRAPE_FAILURE_PATTERN =
  /indispon[ií]vel|n[aã]o foi poss[ií]vel|falha|erro|n[aã]o parsead/i;

function hasScrapeFailure(
  warnings: string[],
  sectionPattern: RegExp
): boolean {
  return warnings.some(
    (warning) =>
      SCRAPE_FAILURE_PATTERN.test(warning) || sectionPattern.test(warning)
  );
}

/** Só substitui notas sync quando o scrape trouxe payload ou confirmou lista vazia. */
export function shouldReplaceSyncedNotas(
  disciplina: TurmaVirtualDisciplinaSnapshot
): boolean {
  if (disciplina.notas.length > 0) return true;

  if (
    hasScrapeFailure(disciplina.scrapeWarnings, /notas?\s+indispon|notas?\s+n[aã]o parsead/i)
  ) {
    return false;
  }

  return disciplina.scrapeWarnings.length === 0;
}

export function shouldReplaceSyncedFaltas(
  disciplina: TurmaVirtualDisciplinaSnapshot
): boolean {
  if (disciplina.faltas.length > 0) return true;

  if (
    hasScrapeFailure(
      disciplina.scrapeWarnings,
      /frequ[eê]ncia indispon|frequ[eê]ncia n[aã]o parsead/i
    )
  ) {
    return false;
  }

  return disciplina.scrapeWarnings.length === 0;
}

export function shouldReplaceSyncedGrupo(
  disciplina: TurmaVirtualDisciplinaSnapshot
): boolean {
  if (disciplina.grupo.length > 0) return true;

  if (hasScrapeFailure(disciplina.scrapeWarnings, /grupo indispon/i)) {
    return false;
  }

  return disciplina.scrapeWarnings.length === 0;
}
