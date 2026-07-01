export const SUBJECT_NICKNAME_MAX_LENGTH = 10;
export const SUBJECT_DISPLAY_NAME_MAX_LENGTH = 120;

const STOP_WORDS = new Set([
  "de",
  "da",
  "do",
  "das",
  "dos",
  "e",
  "em",
  "a",
  "o",
  "as",
  "os",
  "uma",
  "um",
]);

const ROMAN_NUMERAL = /^(i|ii|iii|iv|v|vi)$/i;
const LABORATORY_PREFIX = /^laborat[oó]rio\s+(?:de\s+)?(.+)$/i;
const INTRODUCTION_PREFIX = /^introdu[cç][aã]o\s+(?:[aà]\s+)?(.+)$/i;

export function sanitizeSubjectDisplayName(value: string): string {
  return value
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, SUBJECT_DISPLAY_NAME_MAX_LENGTH);
}

export function sanitizeSubjectNickname(value: string): string {
  return sanitizeSubjectDisplayName(value).slice(0, SUBJECT_NICKNAME_MAX_LENGTH);
}

/** Códigos curtos do PPC/SIGAA (AEDI, LAOCI) — não slugs longos nem `01/1`. */
function isUsableShortCode(code: string): boolean {
  const normalized = code.trim().toUpperCase();
  if (normalized.length < 2 || normalized.length > 6) return false;
  if (!/^[A-Z0-9]+$/.test(normalized)) return false;
  if (/^\d/.test(normalized)) return false;

  return true;
}

function extractSignificantWords(name: string): string[] {
  const words = name.split(/\s+/).filter((word) => word.length > 0);

  return words.filter((word) => {
    const lower = word.toLowerCase();
    if (ROMAN_NUMERAL.test(lower)) return true;
    return !STOP_WORDS.has(lower);
  });
}

function splitTrailingRoman(
  words: string[]
): { coreWords: string[]; roman: string | null } {
  if (words.length === 0) return { coreWords: words, roman: null };

  const last = words[words.length - 1];
  if (!ROMAN_NUMERAL.test(last)) {
    return { coreWords: words, roman: null };
  }

  return {
    coreWords: words.slice(0, -1),
    roman: last.toUpperCase(),
  };
}

function buildInitialsFromWords(words: string[]): string {
  return words.map((word) => toLabelToken(word)[0] ?? "").join("");
}

function truncateNickname(value: string): string {
  if (value.length <= SUBJECT_NICKNAME_MAX_LENGTH) return value;
  return value.slice(0, SUBJECT_NICKNAME_MAX_LENGTH);
}

function stripAccents(value: string): string {
  return value.normalize("NFD").replace(/\p{M}/gu, "");
}

function toLabelToken(value: string): string {
  return stripAccents(value).toUpperCase();
}

function appendRomanSuffix(base: string, roman: string | null): string {
  if (!roman) return truncateNickname(base);
  const combined = `${base}${roman}`;
  if (combined.length <= SUBJECT_NICKNAME_MAX_LENGTH) return combined;
  return truncateNickname(`${base.slice(0, Math.max(1, SUBJECT_NICKNAME_MAX_LENGTH - roman.length))}${roman}`);
}

function suggestFromSignificantWords(words: string[]): string {
  if (words.length === 0) return "DISC";

  const { coreWords, roman } = splitTrailingRoman(words);

  if (coreWords.length === 0 && roman) {
    return truncateNickname(roman);
  }

  const firstWord = coreWords[0];
  const firstUpper = toLabelToken(firstWord);

  if (coreWords.length === 1) {
    return appendRomanSuffix(truncateNickname(firstUpper), roman);
  }

  const initials = buildInitialsFromWords(coreWords);

  // Nome descritivo longo (ex.: Cálculo com Funções de uma Variável Real → CALCUL)
  if (initials.length >= 4 && firstWord.length >= 5) {
    return appendRomanSuffix(firstUpper.slice(0, 6), roman);
  }

  // Primeira palavra domina (ex.: Empreendedorismo e Plano de Negócios → EMPREEND)
  if (initials.length <= 3 && firstWord.length >= 12) {
    return appendRomanSuffix(truncateNickname(firstUpper).slice(0, 8), roman);
  }

  // Iniciais curtas demais (ex.: Inglês Instrumental II → INGII, não III)
  if (initials.length <= 2) {
    return appendRomanSuffix(firstUpper.slice(0, 3), roman);
  }

  return appendRomanSuffix(initials, roman);
}

function suggestFromDisciplineName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "Disc";

  const labMatch = trimmed.match(LABORATORY_PREFIX);
  if (labMatch?.[1]) {
    const inner = suggestFromSignificantWords(extractSignificantWords(labMatch[1]));
    return truncateNickname(`L${inner}`);
  }

  const introMatch = trimmed.match(INTRODUCTION_PREFIX);
  if (introMatch?.[1]) {
    return suggestFromDisciplineName(introMatch[1]);
  }

  return suggestFromSignificantWords(extractSignificantWords(trimmed));
}

/** Gera apelido curto (AEDI, LAOCI, INGII…) a partir do nome SIGAA / PPC. */
export function suggestSubjectNickname(name: string, code: string): string {
  if (isUsableShortCode(code)) {
    return code.trim().toUpperCase();
  }

  return suggestFromDisciplineName(name);
}

/** Rótulo curto para mapa e cards — sempre derivado do nome, nunca `01/1`. */
export function suggestDisciplineShortLabel(name: string): string {
  return suggestFromDisciplineName(name);
}

export function resolveSubjectDisplayName(
  officialName: string,
  nickname?: string | null
): string {
  const nick = nickname?.trim();
  return nick || officialName;
}

export function resolveSubjectShortLabel(
  code: string,
  nickname?: string | null,
  officialName?: string | null
): string {
  const nick = nickname?.trim();
  if (nick) return nick;

  const name = officialName?.trim();
  if (name) {
    return suggestSubjectNickname(name, code);
  }

  if (isUsableShortCode(code)) {
    return code.trim().toUpperCase();
  }

  return truncateNickname(code.trim().toUpperCase());
}
