const RECOVERY_KEY = "planner:recovery-scores";

const EMPTY_MAP: Record<string, number> = Object.freeze({});

const listeners = new Set<() => void>();

interface RecoveryCache {
  raw: string | null;
  map: Record<string, number>;
}

let cache: RecoveryCache | null = null;

function parseRecoveryMap(raw: string | null): Record<string, number> {
  if (!raw) return EMPTY_MAP;

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const next: Record<string, number> = {};

    for (const [code, value] of Object.entries(parsed)) {
      if (typeof value === "number" && !Number.isNaN(value)) {
        next[code] = Math.min(100, Math.max(0, value));
      }
    }

    return Object.keys(next).length > 0 ? next : EMPTY_MAP;
  } catch {
    return EMPTY_MAP;
  }
}

function readRecoveryMap(): Record<string, number> {
  if (typeof window === "undefined") return EMPTY_MAP;

  let raw: string | null;
  try {
    raw = localStorage.getItem(RECOVERY_KEY);
  } catch {
    return EMPTY_MAP;
  }

  if (cache && cache.raw === raw) {
    return cache.map;
  }

  const map = parseRecoveryMap(raw);
  cache = { raw, map };
  return map;
}

function writeRecoveryMap(map: Record<string, number>): void {
  const serialized = JSON.stringify(map);
  localStorage.setItem(RECOVERY_KEY, serialized);
  cache = { raw: serialized, map };
  listeners.forEach((listener) => listener());
}

export function subscribeRecoveryScores(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function loadRecoveryScores(): Record<string, number> {
  return readRecoveryMap();
}

export function getRecoveryScore(
  map: Record<string, number>,
  subjectCode: string
): number | null {
  return map[subjectCode] ?? null;
}

export function saveRecoveryScore(
  subjectCode: string,
  score: number | null
): void {
  const current = { ...readRecoveryMap() };

  if (score === null) {
    delete current[subjectCode];
  } else {
    current[subjectCode] = Math.min(100, Math.max(0, score));
  }

  writeRecoveryMap(current);
}
