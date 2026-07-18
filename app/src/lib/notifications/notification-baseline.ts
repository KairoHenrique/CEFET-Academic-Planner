import { getSession } from "@/lib/auth/session";
import { normalizeCpf } from "@/lib/auth/account/cpf";
import {
  isGradeFingerprintMarkedReadInBaseline,
  normalizeStoredBaselineFingerprint,
} from "@/lib/notifications/notification-fingerprint";

const STORAGE_PREFIX = "planner:notifications:baseline:";

/** CPF só dígitos quando possível — evita baseline “sumir” se o username mudar de formato. */
export function notificationStorageIdentity(): string | null {
  const session = getSession();
  if (!session) return null;
  const raw = (session.cpf ?? session.username)?.trim();
  if (!raw) return null;
  const digits = normalizeCpf(raw);
  return digits.length >= 11 ? digits : raw.toLowerCase();
}

function storageKey(): string | null {
  const identity = notificationStorageIdentity();
  if (!identity) return null;
  return `${STORAGE_PREFIX}${identity}`;
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

export function isNotificationMarkedReadInBaseline(
  fingerprint: string,
  baseline: Set<string>
): boolean {
  if (baseline.has(fingerprint)) return true;
  if (isGradeFingerprintMarkedReadInBaseline(fingerprint, baseline)) return true;
  return isLegacyCalendarSlotMarkedRead(fingerprint, baseline);
}

/**
 * Baseline antiga (B37 sem slot / lembretes 24h·1h): trata `|new` como já visto
 * se o mesmo evento+data já estava no baseline, evitando flood na troca de política.
 */
function isLegacyCalendarSlotMarkedRead(
  fingerprint: string,
  baseline: Set<string>
): boolean {
  const academic = fingerprint.match(
    /^calendar-date-alert:(.+)\|(\d{4}-\d{2}-\d{2})\|new$/
  );
  if (academic) {
    const legacy = `calendar-date-alert:${academic[1]}|${academic[2]}`;
    if (baseline.has(legacy)) return true;
  }

  const calendar = fingerprint.match(
    /^calendar-event-reminder:(.+)\|(\d{4}-\d{2}-\d{2})\|new$/
  );
  if (calendar) {
    const prefix = `calendar-event-reminder:${calendar[1]}|${calendar[2]}|`;
    for (const key of baseline) {
      if (key.startsWith(prefix)) return true;
    }
  }

  return false;
}

const CALENDAR_SLOTS_V2_FLAG = "meta:calendar-notification-slots-v2";
const ACADEMIC_STABLE_V1_FLAG = "meta:academic-alert-stable-v1";

/**
 * One-shot: marca todos os `|new` atuais como lidos para quem já tinha baseline,
 * senão o usuário recebe dezenas de “Nova data / Novo evento” de uma vez.
 * Datas D-1 / no dia continuam notificando quando chegarem.
 */
export function migrateCalendarNotificationSlotsV2(
  stableFingerprints: string[]
): boolean {
  const baseline = readNotificationBaseline();
  if (!baseline || baseline.has(CALENDAR_SLOTS_V2_FLAG)) return false;

  const newsToSeed = stableFingerprints.filter(
    (fp) =>
      fp.endsWith("|new") &&
      (fp.startsWith("calendar-date-alert:") ||
        fp.startsWith("calendar-event-reminder:"))
  );

  mergeNotificationBaseline([...newsToSeed, CALENDAR_SLOTS_V2_FLAG]);
  return true;
}

/**
 * One-shot após fingerprint acadêmico sem id do banco: evita flood no próximo sync
 * (calendario_academico é DELETE+INSERT a cada sync).
 */
export function migrateAcademicDateAlertStableV1(
  stableFingerprints: string[]
): boolean {
  const baseline = readNotificationBaseline();
  if (!baseline || baseline.has(ACADEMIC_STABLE_V1_FLAG)) return false;

  const academic = stableFingerprints.filter((fp) =>
    fp.startsWith("calendar-date-alert:")
  );
  mergeNotificationBaseline([...academic, ACADEMIC_STABLE_V1_FLAG]);
  return true;
}

export function seedNotificationBaselineIfMissing(fingerprints: string[]): void {
  if (readNotificationBaseline() !== null) return;
  writeNotificationBaseline([
    ...fingerprints,
    CALENDAR_SLOTS_V2_FLAG,
    ACADEMIC_STABLE_V1_FLAG,
  ]);
}

/** Primeira baseline após sync: só o que já existia antes, não notas novas do scrape. */
export function initializeNotificationBaselineFromPreSync(
  preSyncFingerprints: string[]
): boolean {
  if (readNotificationBaseline() !== null) return false;
  writeNotificationBaseline([
    ...preSyncFingerprints,
    CALENDAR_SLOTS_V2_FLAG,
    ACADEMIC_STABLE_V1_FLAG,
  ]);
  return true;
}
