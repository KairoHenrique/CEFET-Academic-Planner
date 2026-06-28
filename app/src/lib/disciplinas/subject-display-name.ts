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
  "i",
  "ii",
  "iii",
  "iv",
  "v",
  "vi",
]);

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

export function suggestSubjectNickname(name: string, code: string): string {
  const trimmedCode = code.trim();
  if (
    trimmedCode.length > 0 &&
    trimmedCode.length <= 10 &&
    /^[A-Z0-9-]+$/i.test(trimmedCode)
  ) {
    return trimmedCode.toUpperCase();
  }

  const words = name.split(/\s+/).filter((word) => word.length > 0);
  const significant = words.filter(
    (word) => !STOP_WORDS.has(word.toLowerCase())
  );
  const source = significant.length > 0 ? significant : words;

  if (source.length === 1) {
    const word = source[0];
    if (word.length <= SUBJECT_NICKNAME_MAX_LENGTH) return word;
    return `${word.slice(0, SUBJECT_NICKNAME_MAX_LENGTH - 1)}…`;
  }

  const initials = source.map((word) => word[0]?.toUpperCase() ?? "").join("");
  if (initials.length <= SUBJECT_NICKNAME_MAX_LENGTH) return initials;
  return initials.slice(0, SUBJECT_NICKNAME_MAX_LENGTH);
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
  nickname?: string | null
): string {
  const nick = nickname?.trim();
  return nick || code;
}
