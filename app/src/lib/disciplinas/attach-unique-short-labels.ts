import { normalizeDisciplinaCode } from "@/lib/mapa/course-status";
import {
  buildDisciplineShortLabelRegistry,
  suggestSubjectNickname,
} from "@/lib/disciplinas/subject-display-name";

export interface ShortLabelSource {
  code: string;
  name: string;
  shortLabel?: string;
}

export function attachUniqueShortLabels<T extends ShortLabelSource>(
  entries: T[],
  extraWordsByCode: Map<string, string[]> = new Map()
): Array<T & { shortLabel: string }> {
  const registry = buildDisciplineShortLabelRegistry(
    entries.map((entry) => ({
      code: entry.code,
      name: entry.name,
    })),
    extraWordsByCode
  );

  return entries.map((entry) => {
    const code = normalizeDisciplinaCode(entry.code);
    const shortLabel =
      entry.shortLabel?.trim() ||
      registry.get(code) ||
      suggestSubjectNickname(entry.name, entry.code);

    return {
      ...entry,
      shortLabel,
    };
  });
}
