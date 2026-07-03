import { getSession } from "@/lib/auth/session";
import { normalizeStoredBaselineFingerprint } from "@/lib/notifications/notification-fingerprint";

const STORAGE_PREFIX = "planner:notifications:baseline:";

function storageKey(): string | null {
  const username = getSession()?.username?.trim();
  if (!username) return null;
  return `${STORAGE_PREFIX}${username}`;
}

export function readNotificationBaseline(): Set<string> | null {
  const key = storageKey();
  if (!key || typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as string[];
    return new Set(parsed.map(normalizeStoredBaselineFingerprint));
  } catch {
    return null;
  }
}

export function writeNotificationBaseline(fingerprints: string[]): void {
  const key = storageKey();
  if (!key || typeof window === "undefined") return;
  const normalized = fingerprints.map(normalizeStoredBaselineFingerprint);
  localStorage.setItem(key, JSON.stringify(normalized));
}

/** Une itens já vistos com o snapshot atual (evita re-notificar após re-sync). */
export function mergeNotificationBaseline(fingerprints: string[]): void {
  const current = readNotificationBaseline();
  if (!current) {
    writeNotificationBaseline(fingerprints);
    return;
  }
  const merged = new Set([...current, ...fingerprints]);
  writeNotificationBaseline([...merged]);
}

/** Fingerprints antigas baseadas em id SQLite — invalidadas após sync do portal. */
function isLegacyNotificationKey(key: string): boolean {
  if (key.startsWith("task:id:")) return true;
  return /^task-reminder:\d+:/.test(key);
}

export function migrateLegacyNotificationBaseline(
  stableFingerprints: string[]
): boolean {
  const baseline = readNotificationBaseline();
  if (!baseline || stableFingerprints.length === 0) return false;

  const hasLegacy = [...baseline].some(isLegacyNotificationKey);
  if (!hasLegacy) return false;

  mergeNotificationBaseline(stableFingerprints);
  return true;
}

export function seedNotificationBaselineIfMissing(fingerprints: string[]): void {
  if (readNotificationBaseline() !== null) return;
  writeNotificationBaseline(fingerprints);
}

/** Primeira baseline após sync: só o que já existia antes, não notas novas do scrape. */
export function initializeNotificationBaselineFromPreSync(
  preSyncFingerprints: string[]
): boolean {
  if (readNotificationBaseline() !== null) return false;
  writeNotificationBaseline(preSyncFingerprints);
  return true;
}
