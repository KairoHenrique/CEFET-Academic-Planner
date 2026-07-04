import {
  isPpcCanonicalCodigo,
  normalizeDisciplinaNome,
  resolveDisciplinaCodigoByNome,
} from "@/lib/scraper/portal-discente/resolve-disciplina-codigo";
import type { DisciplinaRow } from "@/lib/types/db";

/** Cruza turma SIGAA com disciplina do mapa/PPC (código, nome ou resolução fuzzy). */
export function findDisciplinaForTurmaOffer(
  codigo: string,
  nome: string,
  disciplinas: DisciplinaRow[]
): DisciplinaRow | undefined {
  const normalizedCode = codigo.trim().toUpperCase();
  const byCode = disciplinas.find(
    (item) => item.codigo.trim().toUpperCase() === normalizedCode
  );
  if (byCode) return byCode;

  const normalizedName = normalizeDisciplinaNome(nome);
  const byName = disciplinas.find(
    (item) => normalizeDisciplinaNome(item.nome) === normalizedName
  );
  if (byName) return byName;

  const resolvedCode = resolveDisciplinaCodigoByNome(nome);
  if (isPpcCanonicalCodigo(resolvedCode)) {
    return disciplinas.find((item) => item.codigo === resolvedCode);
  }

  return undefined;
}
