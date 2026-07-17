import type { NotificationKind } from "@/lib/types/notifications-api";

export function normalizeNotificationText(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

export function normalizeGradeNota(nota: number): string {
  return Number(nota.toFixed(2)).toString();
}

/** Chave estável — sobrevive ao delete/reinsert das tarefas no sync do portal. */
export function buildStableTaskNotificationFingerprint(
  disciplinaId: string,
  titulo: string,
  dataFim: string | null | undefined
): string {
  const due = dataFim?.trim() || "sem-prazo";
  return `task:${disciplinaId.toLowerCase()}|${normalizeNotificationText(titulo)}|${due}`;
}

/** @deprecated Prefer buildStableTaskNotificationFingerprint — mantido para migração de baseline. */
export function buildLegacyTaskNotificationFingerprint(taskId: number): string {
  return `task:id:${taskId}`;
}

export function buildTaskNotificationFingerprint(
  disciplinaId: string,
  titulo: string,
  dataFim: string | null | undefined
): string {
  return buildStableTaskNotificationFingerprint(disciplinaId, titulo, dataFim);
}

export function buildTaskReminderNotificationFingerprint(
  disciplinaId: string,
  titulo: string,
  dataFim: string | null | undefined,
  slot: "24h" | "1h"
): string {
  return `task-reminder:${disciplinaId.toLowerCase()}|${normalizeNotificationText(titulo)}|${dataFim?.trim() || "sem-prazo"}|${slot}`;
}

export function buildGradeNotificationFingerprint(
  disciplinaId: string,
  avaliacao: string,
  nota?: number | null
): string {
  const base = `grade:${disciplinaId.toLowerCase()}|${normalizeNotificationText(avaliacao)}`;
  if (nota === null || nota === undefined || !Number.isFinite(nota)) {
    return base;
  }
  return `${base}|${normalizeGradeNota(nota)}`;
}

export function buildCalendarEventReminderFingerprint(
  eventId: string,
  startDateIso: string,
  slot: "24h" | "1h"
): string {
  return `calendar-event-reminder:${eventId}|${startDateIso}|${slot}`;
}

export function buildClassReminderFingerprint(
  eventId: string,
  startDateIso: string
): string {
  return `class-reminder:${eventId}|${startDateIso}|30m`;
}

/**
 * B36 — chave estável por (categoria, faixa). Só uma nova faixa (50→80→100)
 * gera novo não-lido; re-syncs na mesma faixa são deduplicados pelo baseline.
 */
export function buildIntegralizacaoAlertFingerprint(
  categoria: string,
  band: number
): string {
  return `integralizacao-alert:${normalizeNotificationText(categoria)}|${band}`;
}

/** B37 — chave estável por (evento, data de início). */
export function buildAcademicDateAlertFingerprint(
  eventId: string,
  startDateIso: string
): string {
  return `calendar-date-alert:${eventId}|${startDateIso}`;
}

export function isUrgentClassReminderFingerprint(fingerprint: string): boolean {
  return fingerprint.startsWith("class-reminder:");
}

/** Baseline legada sem nota (`grade:ID|pro1`) ou com nota (`grade:ID|pro1|7.5`). */
export function normalizeStoredBaselineFingerprint(fingerprint: string): string {
  const legacyGradeWithNota = fingerprint.match(/^grade:([^|]+)\|(.+)\|([\d.]+)$/i);
  if (legacyGradeWithNota) {
    return buildGradeNotificationFingerprint(
      legacyGradeWithNota[1],
      legacyGradeWithNota[2],
      parseFloat(legacyGradeWithNota[3])
    );
  }
  return fingerprint;
}

/** Chave legada sem nota no baseline — cobre qualquer nota já vista da avaliação. */
export function buildLegacyGradeEvaluationBaselineKey(
  disciplinaId: string,
  avaliacao: string
): string {
  return `grade:${disciplinaId.toLowerCase()}|${normalizeNotificationText(avaliacao)}`;
}

export function isGradeFingerprintMarkedReadInBaseline(
  fingerprint: string,
  baseline: Set<string>
): boolean {
  if (!fingerprint.startsWith("grade:")) return false;

  const parts = fingerprint.split("|");
  if (parts.length >= 3) {
    const legacyKey = `${parts[0]}|${parts[1]}`;
    if (baseline.has(legacyKey)) return true;
  }

  return false;
}

export function isUrgentTaskReminderFingerprint(fingerprint: string): boolean {
  return fingerprint.endsWith("|1h") && fingerprint.startsWith("task-reminder:");
}

export function isUrgentCalendarReminderFingerprint(fingerprint: string): boolean {
  return (
    fingerprint.startsWith("calendar-event-reminder:") &&
    fingerprint.endsWith("|1h")
  );
}

/** @deprecated Use isUrgentTaskReminderFingerprint or isUrgentCalendarReminderFingerprint */
export function isUrgentReminderFingerprint(fingerprint: string): boolean {
  return (
    isUrgentTaskReminderFingerprint(fingerprint) ||
    isUrgentCalendarReminderFingerprint(fingerprint) ||
    isUrgentClassReminderFingerprint(fingerprint)
  );
}

export function buildNotificationFingerprint(
  kind: NotificationKind,
  payload: {
    disciplinaId?: string;
    titulo?: string;
    dataFim?: string | null;
    avaliacao?: string;
    nota?: number;
    slot?: "24h" | "1h";
  }
): string {
  if (kind === "task" && payload.disciplinaId && payload.titulo !== undefined) {
    return buildTaskNotificationFingerprint(
      payload.disciplinaId,
      payload.titulo,
      payload.dataFim
    );
  }
  if (
    kind === "task-reminder" &&
    payload.disciplinaId &&
    payload.titulo !== undefined &&
    payload.slot
  ) {
    return buildTaskReminderNotificationFingerprint(
      payload.disciplinaId,
      payload.titulo,
      payload.dataFim,
      payload.slot
    );
  }
  if (
    kind === "grade" &&
    payload.disciplinaId &&
    payload.avaliacao &&
    payload.nota !== undefined
  ) {
    return buildGradeNotificationFingerprint(
      payload.disciplinaId,
      payload.avaliacao,
      payload.nota
    );
  }
  throw new Error("Payload inválido para fingerprint de notificação.");
}
