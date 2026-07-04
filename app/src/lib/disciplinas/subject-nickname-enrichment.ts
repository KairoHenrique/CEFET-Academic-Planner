import {
  extractNicknameSourceName,
  extractSignificantWords,
  isTopicosDisciplineName,
} from "@/lib/disciplinas/subject-nickname-core";

const MYMEMORY_ENDPOINT = "https://api.mymemory.translated.net/get";
const REQUEST_TIMEOUT_MS = 2500;
const MAX_PHRASE_LENGTH = 480;

const translationCache = new Map<string, string[]>();

function isValidTranslation(text: string): boolean {
  const upper = text.trim().toUpperCase();
  if (!upper) return false;
  if (upper.includes("INVALID") || upper.includes("QUERY LENGTH")) return false;
  if (upper.includes("MYMEMORY WARNING")) return false;
  return true;
}

async function fetchTranslatedPhrase(phrase: string): Promise<string | null> {
  const trimmed = phrase.trim().slice(0, MAX_PHRASE_LENGTH);
  if (!trimmed) return null;

  const cached = translationCache.get(trimmed);
  if (cached) {
    return cached.length > 0 ? cached.join(" ") : null;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const url = new URL(MYMEMORY_ENDPOINT);
    url.searchParams.set("q", trimmed);
    url.searchParams.set("langpair", "pt-BR|en");

    const response = await fetch(url.toString(), {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      translationCache.set(trimmed, []);
      return null;
    }

    const payload = (await response.json()) as {
      responseData?: { translatedText?: string };
    };
    const translated = payload.responseData?.translatedText?.trim() ?? "";

    if (!isValidTranslation(translated)) {
      translationCache.set(trimmed, []);
      return null;
    }

    const words = extractSignificantWords(translated);
    translationCache.set(trimmed, words);
    return words.length > 0 ? words.join(" ") : translated;
  } catch {
    translationCache.set(trimmed, []);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

/** MyMemory (grátis): enriquece siglas de tópicos com tokens em inglês quando útil. */
export async function enrichNicknameWordsFromApi(
  name: string
): Promise<string[]> {
  if (!isTopicosDisciplineName(name)) return [];

  const source = extractNicknameSourceName(name);
  const cached = translationCache.get(source);
  if (cached) return cached;

  await fetchTranslatedPhrase(source);
  return translationCache.get(source) ?? [];
}

export async function buildExtraNicknameWordsByCode(
  entries: Array<{ code: string; name: string }>
): Promise<Map<string, string[]>> {
  const result = new Map<string, string[]>();
  const topicos = entries.filter((entry) => isTopicosDisciplineName(entry.name));

  await Promise.all(
    topicos.map(async (entry) => {
      const words = await enrichNicknameWordsFromApi(entry.name);
      if (words.length > 0) {
        result.set(entry.code.trim().toUpperCase(), words);
      }
    })
  );

  return result;
}

export function clearNicknameEnrichmentCacheForTests(): void {
  translationCache.clear();
}
