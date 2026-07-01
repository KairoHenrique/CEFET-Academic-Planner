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
  nota: number
): string {
  return `grade:${disciplinaId}|${avaliacao}|${normalizeGradeNota(nota)}`;
}

export function isUrgentTaskReminderFingerprint(fingerprint: string): boolean {
  return fingerprint.endsWith("|1h");
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
