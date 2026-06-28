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

function isPpcStyleCode(code: string): boolean {
  const normalized = code.trim().toUpperCase();
  if (normalized.length < 2 || normalized.length > 10) return false;
  if (!/^[A-Z0-9-]+$/.test(normalized)) return false;

  const hyphenCount = (normalized.match(/-/g) ?? []).length;
  if (hyphenCount > 1) return false;
  if (hyphenCount === 1 && normalized.length > 9) return false;

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

function buildInitialsFromWords(words: string[]): string {
  return words.map((word) => word[0]?.toUpperCase() ?? "").join("");
}

function truncateNickname(value: string): string {
  if (value.length <= SUBJECT_NICKNAME_MAX_LENGTH) return value;
  return value.slice(0, SUBJECT_NICKNAME_MAX_LENGTH);
}

function suggestFromSignificantWords(words: string[]): string {
  if (words.length === 0) return "DISC";

  if (words.length === 1) {
    return truncateNickname(words[0].toUpperCase());
  }

  const initials = buildInitialsFromWords(words);
  if (initials.length <= 3 && words[0].length >= 10) {
    return truncateNickname(words[0].slice(0, 8).toUpperCase());
  }

  return truncateNickname(initials);
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

/** Gera apelido curto (AEDI, LAOCI, EMPREEND…) a partir do nome SIGAA / PPC. */
export function suggestSubjectNickname(name: string, code: string): string {
  if (isPpcStyleCode(code)) {
    return code.trim().toUpperCase();
  }

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

  if (isPpcStyleCode(code)) {
    return code.trim().toUpperCase();
  }

  return truncateNickname(code.trim().toUpperCase());
}
