import { getConfig, setConfig } from "@/lib/db/queries";
import { getPostgresPool } from "@/lib/db/postgres/pool";
import type { PriorityLevel } from "@/lib/types/priority";
import {
  isPriorityLevel,
  normalizePriorityLevel,
} from "@/lib/types/priority";

export const SUBJECT_PRIORITIES_CONFIG_KEY = "prefs.subject_priorities";

export type SubjectPriorityMap = Record<string, PriorityLevel>;

function parsePriorityMap(raw: string | null | undefined): SubjectPriorityMap {
  if (!raw?.trim()) return {};
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const next: SubjectPriorityMap = {};
    for (const [code, value] of Object.entries(parsed)) {
      if (typeof code !== "string" || !code.trim()) continue;
      if (typeof value !== "string" || !isPriorityLevel(value)) continue;
      next[code.trim()] = normalizePriorityLevel(value);
    }
    return next;
  } catch {
    return {};
  }
}

/** SQLite do usuário (local / staging worker). */
export function getSubjectPrioritiesFromStore(): SubjectPriorityMap {
  return parsePriorityMap(getConfig(SUBJECT_PRIORITIES_CONFIG_KEY));
}

export function saveSubjectPrioritiesToStore(
  map: SubjectPriorityMap
): SubjectPriorityMap {
  const cleaned: SubjectPriorityMap = {};
  for (const [code, level] of Object.entries(map)) {
    if (!code.trim() || !isPriorityLevel(level)) continue;
    cleaned[code.trim()] = normalizePriorityLevel(level);
  }
  setConfig(SUBJECT_PRIORITIES_CONFIG_KEY, JSON.stringify(cleaned));
  return cleaned;
}

/** Merge partial map into stored priorities. */
export function mergeSubjectPrioritiesToStore(
  patch: SubjectPriorityMap
): SubjectPriorityMap {
  return saveSubjectPrioritiesToStore({
    ...getSubjectPrioritiesFromStore(),
    ...patch,
  });
}

export async function pgGetSubjectPriorities(
  userId: string
): Promise<SubjectPriorityMap> {
  const result = await getPostgresPool().query<{ valor: string }>(
    `SELECT valor FROM configuracoes
     WHERE user_id = $1 AND chave = $2
     LIMIT 1`,
    [userId, SUBJECT_PRIORITIES_CONFIG_KEY]
  );
  return parsePriorityMap(result.rows[0]?.valor);
}

export async function pgSaveSubjectPriorities(
  userId: string,
  map: SubjectPriorityMap
): Promise<SubjectPriorityMap> {
  const cleaned: SubjectPriorityMap = {};
  for (const [code, level] of Object.entries(map)) {
    if (!code.trim() || !isPriorityLevel(level)) continue;
    cleaned[code.trim()] = normalizePriorityLevel(level);
  }

  await getPostgresPool().query(
    `INSERT INTO configuracoes (user_id, chave, valor)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id, chave) DO UPDATE SET valor = EXCLUDED.valor`,
    [userId, SUBJECT_PRIORITIES_CONFIG_KEY, JSON.stringify(cleaned)]
  );

  // Espelha no SQLite do tenant (staging / worker).
  try {
    saveSubjectPrioritiesToStore(cleaned);
  } catch {
    /* SQLite pode não estar disponível em alguns caminhos de API */
  }

  return cleaned;
}

export async function pgMergeSubjectPriorities(
  userId: string,
  patch: SubjectPriorityMap
): Promise<SubjectPriorityMap> {
  const current = await pgGetSubjectPriorities(userId);
  return pgSaveSubjectPriorities(userId, { ...current, ...patch });
}
