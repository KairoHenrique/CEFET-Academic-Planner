export const SUBJECT_NICKNAME_MAX_LENGTH = 10;
export const SUBJECT_DISPLAY_NAME_MAX_LENGTH = 120;

export function sanitizeSubjectDisplayName(value: string): string {
  return value
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, SUBJECT_DISPLAY_NAME_MAX_LENGTH);
}

export function sanitizeSubjectNickname(value: string): string {
  return coreSanitizeSubjectNickname(value);
}

export {
  disambiguateNickname,
  extractNicknameSourceName,
  extractSignificantWords,
  isTopicosDisciplineName,
  isUsableShortCode,
  suggestBaseNickname,
  suggestBaseNicknameFromName,
} from "@/lib/disciplinas/subject-nickname-core";

import {
  suggestBaseNickname,
  suggestBaseNicknameFromName,
  sanitizeSubjectNickname as coreSanitizeSubjectNickname,
} from "@/lib/disciplinas/subject-nickname-core";
import {
  buildUniqueShortLabelRegistry,
  resolveShortLabelFromRegistry,
  type ShortLabelEntry,
} from "@/lib/disciplinas/subject-short-label-registry";

/** Gera apelido curto (AEDI, LAOCI, INGII…) a partir do nome SIGAA / PPC. */
export function suggestSubjectNickname(name: string, code: string): string {
  return suggestBaseNickname(name, code);
}

/** Rótulo curto para mapa e cards — sempre derivado do nome, nunca `01/1`. */
export function suggestDisciplineShortLabel(name: string): string {
  return suggestBaseNicknameFromName(name);
}

export function buildDisciplineShortLabelRegistry(
  entries: ShortLabelEntry[],
  extraWordsByCode?: Map<string, string[]>
): Map<string, string> {
  return buildUniqueShortLabelRegistry(entries, extraWordsByCode);
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
  officialName?: string | null,
  registry?: Map<string, string>
): string {
  const nick = nickname?.trim();
  if (nick) return nick;

  const name = officialName?.trim();
  const fallback = name
    ? suggestSubjectNickname(name, code)
    : suggestBaseNickname("", code);

  return resolveShortLabelFromRegistry(code, registry, fallback);
}
