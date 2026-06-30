import { getDisciplinas } from "@/lib/db/queries";

export function normalizeDisciplinaNome(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function significantTokens(nome: string): string[] {
  const stop = new Set(["de", "da", "do", "das", "dos", "e", "em", "a", "o", "i", "ii", "iii"]);
  return normalizeDisciplinaNome(nome)
    .split(" ")
    .filter((token) => token.length > 1 && !stop.has(token));
}

function isLaboratorioNome(nome: string): boolean {
  return /^laboratorio\b/.test(normalizeDisciplinaNome(nome));
}

/** Pontua similaridade entre nomes SIGAA (genérico para qualquer disciplina). */
export function scoreDisciplinaNomeMatch(target: string, candidate: string): number {
  if (target === candidate) return 1000;

  const targetIsLab = isLaboratorioNome(target);
  const candidateIsLab = isLaboratorioNome(candidate);
  if (targetIsLab !== candidateIsLab) return -1;

  if (target.startsWith(candidate) || candidate.startsWith(target)) {
    return 500 - Math.abs(target.length - candidate.length);
  }

  if (target.includes(candidate) || candidate.includes(target)) {
    const shorter = Math.min(target.length, candidate.length);
    const longer = Math.max(target.length, candidate.length);
    return 200 + shorter - (longer - shorter);
  }

  const targetTokens = new Set(significantTokens(target));
  const candidateTokens = significantTokens(candidate);
  if (targetTokens.size === 0 || candidateTokens.length === 0) return -1;

  let overlap = 0;
  for (const token of candidateTokens) {
    if (targetTokens.has(token)) overlap += 1;
  }

  const minTokens = Math.min(targetTokens.size, candidateTokens.length);
  if (overlap >= 2 || (minTokens === 1 && overlap === 1)) {
    return 80 + overlap * 15;
  }

  return -1;
}

function bestDisciplinaCodigoByScore(
  target: string,
  entries: Array<{ nome: string; codigo: string }>
): string | null {
  let best: { codigo: string; score: number } | null = null;

  for (const entry of entries) {
    const candidate = normalizeDisciplinaNome(entry.nome);
    const score = scoreDisciplinaNomeMatch(target, candidate);
    if (score < 0) continue;
    if (!best || score > best.score) {
      best = { codigo: entry.codigo, score };
    }
  }

  return best && best.score >= 80 ? best.codigo : null;
}

/** Resolve código PPC a partir do nome exibido no portal SIGAA. */
export function resolveDisciplinaCodigoByNome(nomeOuCodigo: string): string {
  const trimmed = nomeOuCodigo.trim();
  if (/^\d{2}\/\d$/.test(trimmed)) {
    const periodo = getDisciplinas().find(
      (disciplina) => disciplina.codigo === trimmed
    );
    if (periodo) return periodo.codigo;
  }
  if (/^[A-Z0-9.-]{2,12}$/.test(trimmed)) {
    return trimmed.toUpperCase();
  }

  const target = normalizeDisciplinaNome(trimmed);
  const disciplinas = getDisciplinas();

  const exact = disciplinas.find(
    (disciplina) => normalizeDisciplinaNome(disciplina.nome) === target
  );
  if (exact) return exact.codigo;

  const scored = bestDisciplinaCodigoByScore(
    target,
    disciplinas.map((disciplina) => ({
      nome: disciplina.nome,
      codigo: disciplina.codigo,
    }))
  );
  if (scored) return scored;

  return trimmed.slice(0, 24).replace(/\s+/g, "-").toUpperCase();
}

export function resolveDisciplinaCodigoFromSemestre(
  ref: string,
  semestreByNome: ReadonlyMap<string, string>,
  activeIds: ReadonlySet<string>
): string | null {
  const target = normalizeDisciplinaNome(ref);
  const direct = semestreByNome.get(target);
  if (direct && activeIds.has(direct)) return direct;

  const semestreEntries = Array.from(semestreByNome.entries())
    .filter(([, codigo]) => activeIds.has(codigo))
    .map(([nome, codigo]) => ({ nome, codigo }));

  const scored = bestDisciplinaCodigoByScore(target, semestreEntries);
  if (scored) return scored;

  const fallback = resolveDisciplinaCodigoByNome(ref);
  return activeIds.has(fallback) ? fallback : null;
}
