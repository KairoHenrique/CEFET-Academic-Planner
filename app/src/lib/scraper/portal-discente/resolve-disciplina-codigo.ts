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

/** Código canônico do PPC — ex.: `06/3`, `04/7`. */
export function isPpcCanonicalCodigo(codigo: string): boolean {
  return /^\d{2}\/\d$/.test(codigo.trim());
}

function significantTokens(nome: string): string[] {
  const stop = new Set(["de", "da", "do", "das", "dos", "e", "em", "a", "o"]);
  return normalizeDisciplinaNome(nome)
    .split(" ")
    .filter((token) => token.length > 0 && !stop.has(token));
}

function isLaboratorioNome(nome: string): boolean {
  const normalized = normalizeDisciplinaNome(nome);
  return /^laboratorio\b/.test(normalized) || /^lab\b/.test(normalized);
}

function listPpcDisciplinaEntries(): Array<{ nome: string; codigo: string }> {
  return getDisciplinas()
    .filter((disciplina) => isPpcCanonicalCodigo(disciplina.codigo))
    .map((disciplina) => ({
      nome: disciplina.nome,
      codigo: disciplina.codigo,
    }));
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
  const ppcEntries = listPpcDisciplinaEntries();

  if (isPpcCanonicalCodigo(trimmed)) {
    const ppc = ppcEntries.find((entry) => entry.codigo === trimmed);
    if (ppc) return ppc.codigo;
  }

  const target = normalizeDisciplinaNome(trimmed);

  const exactPpc = ppcEntries.find(
    (entry) => normalizeDisciplinaNome(entry.nome) === target
  );
  if (exactPpc) return exactPpc.codigo;

  const scored = bestDisciplinaCodigoByScore(target, ppcEntries);
  if (scored) return scored;

  const disciplinas = getDisciplinas();
  const alias = disciplinas.find(
    (disciplina) =>
      !isPpcCanonicalCodigo(disciplina.codigo) &&
      (disciplina.codigo.toUpperCase() === trimmed.toUpperCase() ||
        normalizeDisciplinaNome(disciplina.nome) === target)
  );
  if (alias) return alias.codigo;

  return trimmed.slice(0, 24).replace(/\s+/g, "-").toUpperCase();
}

/**
 * Resolve código para persistência do portal: prioriza nome completo e PPC,
 * evitando aliases do quadro (ENG-SOFT, AEDI…) quando há match no catálogo.
 */
export function resolveDisciplinaCodigoForPortal(
  codigoHorario: string | null | undefined,
  nome: string
): string {
  const fromNome = resolveDisciplinaCodigoByNome(nome);
  if (isPpcCanonicalCodigo(fromNome)) return fromNome;

  const codigo = codigoHorario?.trim() ?? "";
  if (codigo && isPpcCanonicalCodigo(codigo)) return codigo;

  if (fromNome) return fromNome;
  return codigo ? codigo.toUpperCase() : fromNome;
}

/** Resolve código PPC a partir do nome e do código SIGAA (G05…) do PDF do histórico. */
export function resolveDisciplinaCodigoForHistorico(
  nome: string,
  sigaaCodigo?: string | null
): string {
  const fromNome = resolveDisciplinaCodigoByNome(nome);
  if (isPpcCanonicalCodigo(fromNome)) return fromNome;

  const fromSigaa = resolveDisciplinaCodigoBySigaaComponent(sigaaCodigo);
  if (fromSigaa) return fromSigaa;

  return fromNome;
}

function normalizeSigaaComponentKey(value: string): string {
  return value
    .toUpperCase()
    .replace(/^GT?05/, "")
    .replace(/[^A-Z0-9]/g, "");
}

/** Mapeia abreviação G05 do histórico para disciplina PPC por similaridade de tokens. */
function resolveDisciplinaCodigoBySigaaComponent(
  sigaaCodigo?: string | null
): string | null {
  const raw = sigaaCodigo?.trim();
  if (!raw || !/^G[T]?05/i.test(raw)) return null;

  const componentKey = normalizeSigaaComponentKey(raw);
  if (componentKey.length < 4) return null;

  const ppcEntries = listPpcDisciplinaEntries();
  let best: { codigo: string; score: number } | null = null;

  for (const entry of ppcEntries) {
    const nomeKey = normalizeDisciplinaNome(entry.nome).replace(/[^a-z0-9]/g, "");
    const tokens = significantTokens(entry.nome).map((token) =>
      token.replace(/[^a-z0-9]/g, "")
    );

    let score = 0;
    if (componentKey.includes(nomeKey.slice(0, 6))) score += 120;
    if (nomeKey.includes(componentKey.slice(0, 6))) score += 100;

    for (const token of tokens) {
      if (token.length < 3) continue;
      if (componentKey.includes(token.slice(0, 4))) score += 25;
    }

    if (!best || score > best.score) {
      best = { codigo: entry.codigo, score };
    }
  }

  return best && best.score >= 100 ? best.codigo : null;
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
