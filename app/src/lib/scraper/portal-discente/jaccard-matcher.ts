import { normalizeDisciplinaNome } from "./resolve-disciplina-codigo";

// ─── Stopwords PT-BR para contexto acadêmico ────────────────────────────
const STOP_WORDS = new Set([
  "de", "da", "do", "das", "dos", "e", "em", "a", "o", "as", "os",
  "na", "no", "nas", "nos", "para", "por", "com", "uma", "um",
  "ao", "aos", "à", "às", "se", "que",
]);

// ─── Tokenização ─────────────────────────────────────────────────────────

/**
 * Tokeniza um texto para comparação Jaccard.
 * Normaliza acentos, lowercase, remove pontuação e stopwords.
 * Retorna um Set de tokens significativos.
 */
export function jaccardTokenize(text: string): Set<string> {
  if (!text) return new Set();

  const normalized = normalizeDisciplinaNome(text);
  const tokens = normalized
    .split(/\s+/)
    .filter((t) => t.length > 0 && !STOP_WORDS.has(t));

  return new Set(tokens);
}

// ─── Jaccard Index ───────────────────────────────────────────────────────

/**
 * Calcula o Jaccard Index entre dois sets de tokens.
 * J(A, B) = |A ∩ B| / |A ∪ B|
 * Retorna float entre 0.0 e 1.0.
 */
export function jaccardIndex(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 0;
  if (a.size === 0 || b.size === 0) return 0;

  let intersection = 0;
  const smaller = a.size <= b.size ? a : b;
  const larger = a.size <= b.size ? b : a;

  for (const token of smaller) {
    if (larger.has(token)) intersection += 1;
  }

  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

// ─── Disciplina Matching ─────────────────────────────────────────────────

export interface JaccardCandidateEntry {
  codigo: string;
  nome: string;
  ementa?: string | null;
  carga_horaria?: number | null;
}

export interface JaccardMatchResult {
  codigo: string;
  score: number;
  nomeScore: number;
  ementaScore: number;
}

/** Peso do nome no score final. */
const WEIGHT_NOME = 0.7;
/** Peso da ementa no score final. */
const WEIGHT_EMENTA = 0.3;
/** Bonus quando a carga horária bate exatamente. */
const CH_BONUS = 0.08;
/** Threshold mínimo para considerar um match válido. */
const MATCH_THRESHOLD = 0.40;

/**
 * Verifica se uma ementa contém conteúdo real (não é placeholder).
 */
function hasRealEmenta(ementa: string | null | undefined): boolean {
  if (!ementa) return false;
  const trimmed = ementa.trim().toLowerCase();
  return (
    trimmed.length > 20 &&
    !trimmed.startsWith("a definir") &&
    !trimmed.startsWith("conforme ppc")
  );
}

/**
 * Verifica se o nome indica um laboratório.
 */
function isLabNome(tokens: Set<string>): boolean {
  return tokens.has("laboratorio") || tokens.has("lab");
}

/**
 * Calcula score combinado de match entre uma disciplina do PDF e uma candidata PPC.
 *
 * @param targetNome - Nome normalizado da disciplina (do PDF/SIGAA)
 * @param targetCh - Carga horária da disciplina (do PDF), ou 0 se desconhecida
 * @param candidate - Entrada do catálogo PPC
 * @returns Score final ou -1 se descartado (lab mismatch)
 */
export function jaccardScoreDisciplina(
  targetNome: string,
  targetCh: number,
  candidate: JaccardCandidateEntry
): JaccardMatchResult {
  const targetTokens = jaccardTokenize(targetNome);
  const candidateTokens = jaccardTokenize(candidate.nome);

  // Guard: lab vs não-lab
  if (isLabNome(targetTokens) !== isLabNome(candidateTokens)) {
    return { codigo: candidate.codigo, score: -1, nomeScore: -1, ementaScore: 0 };
  }

  const nomeScore = jaccardIndex(targetTokens, candidateTokens);

  let ementaScore = 0;
  let effectiveWeight = 1.0; // 100% nome quando ementa indisponível

  if (hasRealEmenta(candidate.ementa)) {
    const targetEmentaTokens = targetTokens; // Usa tokens do nome como proxy (PDF não tem ementa)
    const candidateEmentaTokens = jaccardTokenize(candidate.ementa!);

    // Cross-match: tokens do nome do PDF vs tokens da ementa do PPC
    // Isso captura quando o nome da disciplina aparece descrito na ementa
    ementaScore = jaccardIndex(targetEmentaTokens, candidateEmentaTokens);
    effectiveWeight = WEIGHT_NOME;
  }

  let score: number;
  if (effectiveWeight < 1.0) {
    score = nomeScore * WEIGHT_NOME + ementaScore * WEIGHT_EMENTA;
  } else {
    score = nomeScore;
  }

  // Bonus se CH bate
  if (targetCh > 0 && candidate.carga_horaria && targetCh === candidate.carga_horaria) {
    score += CH_BONUS;
  }

  return { codigo: candidate.codigo, score, nomeScore, ementaScore };
}

/**
 * Encontra o melhor match Jaccard entre um nome de disciplina e o catálogo PPC.
 *
 * @param targetNome - Nome da disciplina do PDF/SIGAA
 * @param targetCh - Carga horária (0 se desconhecida)
 * @param candidates - Lista de disciplinas PPC
 * @param threshold - Threshold mínimo (default: MATCH_THRESHOLD)
 * @returns Código PPC do melhor match, ou null se nenhum ultrapassar o threshold
 */
export function findBestJaccardMatch(
  targetNome: string,
  targetCh: number,
  candidates: JaccardCandidateEntry[],
  threshold = MATCH_THRESHOLD
): string | null {
  let best: JaccardMatchResult | null = null;

  for (const candidate of candidates) {
    const result = jaccardScoreDisciplina(targetNome, targetCh, candidate);
    if (result.score < 0) continue;
    if (!best || result.score > best.score) {
      best = result;
    }
  }

  return best && best.score >= threshold ? best.codigo : null;
}
