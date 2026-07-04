import { normalizeDisciplinaCode } from "@/lib/mapa/course-status";
import {
  disambiguateNickname,
  suggestBaseNickname,
  sanitizeSubjectNickname,
} from "@/lib/disciplinas/subject-nickname-core";

export interface ShortLabelEntry {
  code: string;
  name: string;
  nickname?: string | null;
}

function assignUniqueLabel(
  base: string,
  name: string,
  reserved: Set<string>,
  extraWords: string[]
): string {
  let attempt = 0;
  let label = disambiguateNickname(base, name, attempt, extraWords);

  while (reserved.has(label) && attempt < 16) {
    attempt += 1;
    label = disambiguateNickname(base, name, attempt, extraWords);
  }

  reserved.add(label);
  return label;
}

/** Garante apelidos únicos no catálogo — evita colisões entre tópicos e demais disciplinas. */
export function buildUniqueShortLabelRegistry(
  entries: ShortLabelEntry[],
  extraWordsByCode: Map<string, string[]> = new Map()
): Map<string, string> {
  const reserved = new Set<string>();
  const result = new Map<string, string>();

  for (const entry of entries) {
    const code = normalizeDisciplinaCode(entry.code);
    const nick = entry.nickname?.trim();
    if (!nick) continue;

    const label = sanitizeSubjectNickname(nick);
    reserved.add(label);
    result.set(code, label);
  }

  const pending = entries
    .filter((entry) => !result.has(normalizeDisciplinaCode(entry.code)))
    .sort((left, right) => right.name.length - left.name.length);

  for (const entry of pending) {
    const code = normalizeDisciplinaCode(entry.code);
    const extra = extraWordsByCode.get(code) ?? [];
    const base = suggestBaseNickname(entry.name, entry.code, extra);
    const label = assignUniqueLabel(base, entry.name, reserved, extra);
    result.set(code, label);
  }

  return result;
}

export function resolveShortLabelFromRegistry(
  code: string,
  registry: Map<string, string> | undefined,
  fallback: string
): string {
  if (!registry) return fallback;
  return registry.get(normalizeDisciplinaCode(code)) ?? fallback;
}
