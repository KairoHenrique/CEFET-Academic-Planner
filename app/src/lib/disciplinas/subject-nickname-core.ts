import { resolveNicknameOverride } from "@/lib/disciplinas/subject-nickname-overrides";

const SUBJECT_NICKNAME_MAX_LENGTH = 10;

export function sanitizeSubjectNickname(value: string): string {
  return value
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, SUBJECT_NICKNAME_MAX_LENGTH);
}

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
  "com",
  "para",
  "por",
]);

const ROMAN_NUMERAL = /^(i|ii|iii|iv|v|vi)$/i;
const LABORATORY_PREFIX = /^laborat[oó]rio\s+(?:de\s+)?(.+)$/i;
const INTRODUCTION_PREFIX = /^introdu[cç][aã]o\s+(?:[aà]\s+)?(.+)$/i;
const TOPICOS_COLON =
  /^t[oó]picos\s+especiais(?:\s+(?:em|de)\s+[^:]{0,120})?\s*:\s*(.+)$/i;
const GT_PREFIX = /^gt\s*\d+\s*[-–—]\s*(.+)$/i;

/** Códigos curtos do PPC/SIGAA (AEDI, LAOCI) — não slugs longos nem `01/1`. */
export function isUsableShortCode(code: string): boolean {
  const normalized = code.trim().toUpperCase();
  if (normalized.length < 2 || normalized.length > 6) return false;
  if (!/^[A-Z0-9]+$/.test(normalized)) return false;
  if (/^\d/.test(normalized)) return false;

  return true;
}

export function isTopicosDisciplineName(name: string): boolean {
  return TOPICOS_COLON.test(name.trim());
}

/** Nome base para sigla — tópicos usam só o trecho após `:`. */
export function extractNicknameSourceName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return trimmed;

  const topicos = trimmed.match(TOPICOS_COLON);
  if (topicos?.[1]) return topicos[1].trim();

  const gt = trimmed.match(GT_PREFIX);
  if (gt?.[1]) return extractNicknameSourceName(gt[1]);

  const labMatch = trimmed.match(LABORATORY_PREFIX);
  if (labMatch?.[1]) return labMatch[1].trim();

  const introMatch = trimmed.match(INTRODUCTION_PREFIX);
  if (introMatch?.[1]) return extractNicknameSourceName(introMatch[1]);

  return trimmed;
}

export function extractSignificantWords(name: string): string[] {
  const words = name.split(/\s+/).filter((word) => word.length > 0);

  return words.filter((word) => {
    const lower = word.toLowerCase();
    if (ROMAN_NUMERAL.test(lower)) return true;
    return !STOP_WORDS.has(lower);
  });
}

function splitTrailingRoman(words: string[]): {
  coreWords: string[];
  roman: string | null;
} {
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

function stripAccents(value: string): string {
  return value.normalize("NFD").replace(/\p{M}/gu, "");
}

function toLabelToken(value: string): string {
  return stripAccents(value).replace(/[^A-Za-z0-9]/g, "").toUpperCase();
}

function truncateNickname(value: string): string {
  if (value.length <= SUBJECT_NICKNAME_MAX_LENGTH) return value;
  return value.slice(0, SUBJECT_NICKNAME_MAX_LENGTH);
}

function appendRomanSuffix(base: string, roman: string | null): string {
  if (!roman) return truncateNickname(base);
  const combined = `${base}${roman}`;
  if (combined.length <= SUBJECT_NICKNAME_MAX_LENGTH) return combined;
  return truncateNickname(
    `${base.slice(0, Math.max(1, SUBJECT_NICKNAME_MAX_LENGTH - roman.length))}${roman}`
  );
}

function buildInitialsFromWords(words: string[]): string {
  return words.map((word) => toLabelToken(word)[0] ?? "").join("");
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

  if (initials.length >= 4 && firstWord.length >= 5) {
    return appendRomanSuffix(firstUpper.slice(0, 6), roman);
  }

  if (initials.length <= 3 && firstWord.length >= 12) {
    return appendRomanSuffix(truncateNickname(firstUpper).slice(0, 8), roman);
  }

  if (initials.length <= 2) {
    return appendRomanSuffix(firstUpper.slice(0, 3), roman);
  }

  return appendRomanSuffix(initials, roman);
}

function isLaboratoryName(name: string): boolean {
  return LABORATORY_PREFIX.test(name.trim());
}

export function suggestBaseNicknameFromName(
  name: string,
  extraWords: string[] = []
): string {
  const override = resolveNicknameOverride(name);
  if (override) return override;

  const source = extractNicknameSourceName(name);
  const trimmed = name.trim();
  const words = [
    ...extractSignificantWords(source),
    ...extraWords.flatMap((item) => extractSignificantWords(item)),
  ];

  if (words.length === 0) return "DISC";

  if (isTopicosDisciplineName(trimmed) && words.length >= 2) {
    const first = toLabelToken(words[0]).slice(0, 3);
    const second = toLabelToken(words[1]).slice(0, 4);
    const { roman } = splitTrailingRoman(words);
    return appendRomanSuffix(truncateNickname(`${first}${second}`), roman);
  }

  const base = suggestFromSignificantWords(words);

  if (isLaboratoryName(trimmed) && !base.startsWith("L")) {
    return truncateNickname(`L${base}`);
  }

  return base;
}

export function suggestBaseNickname(
  name: string,
  code: string,
  extraWords: string[] = []
): string {
  // Apelido curado tem prioridade sobre o código SIGAA (que costuma ser ruim).
  const override = resolveNicknameOverride(name);
  if (override) return override;

  const normalizedCode = code.trim().toUpperCase();
  if (!/^GT\d+/i.test(normalizedCode) && isUsableShortCode(code)) {
    return normalizedCode;
  }

  return suggestBaseNicknameFromName(name, extraWords);
}

export function disambiguateNickname(
  base: string,
  name: string,
  attempt: number,
  extraWords: string[] = []
): string {
  if (attempt <= 0) return truncateNickname(base);

  const source = extractNicknameSourceName(name);
  const words = [
    ...extractSignificantWords(source),
    ...extraWords.flatMap((item) => extractSignificantWords(item)),
  ];
  const { coreWords, roman } = splitTrailingRoman(words);

  if (attempt === 1 && coreWords.length >= 2) {
    const w1 = toLabelToken(coreWords[0]);
    const w2 = toLabelToken(coreWords[1]);
    const blend = `${w1.slice(0, 4)}${w2.slice(0, 4)}`;
    return appendRomanSuffix(truncateNickname(blend), roman);
  }

  if (attempt === 2 && coreWords.length >= 3) {
    return appendRomanSuffix(
      buildInitialsFromWords(coreWords.slice(0, 4)),
      roman
    );
  }

  if (attempt === 3 && coreWords.length >= 2) {
    const w1 = toLabelToken(coreWords[0]).slice(0, 5);
    const w2 = toLabelToken(coreWords[1]).slice(0, 4);
    return appendRomanSuffix(truncateNickname(`${w1}${w2}`), roman);
  }

  const digit = String(Math.min(9, attempt - 2));
  const trimmed = truncateNickname(base).slice(
    0,
    Math.max(1, SUBJECT_NICKNAME_MAX_LENGTH - 1)
  );
  return `${trimmed}${digit}`;
}
