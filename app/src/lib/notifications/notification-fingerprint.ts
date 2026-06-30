import type { NotificationKind } from "@/lib/types/notifications-api";

export function normalizeGradeNota(nota: number): string {
  return Number(nota.toFixed(2)).toString();
}

/** Chave estável — mesmo item após re-sync não gera nova notificação. */
export function buildTaskNotificationFingerprint(taskId: number): string {
  return `task:id:${taskId}`;
}

export function buildGradeNotificationFingerprint(
  disciplinaId: string,
  avaliacao: string,
  nota: number
): string {
  return `grade:${disciplinaId}|${avaliacao}|${normalizeGradeNota(nota)}`;
}

export function buildNotificationFingerprint(
  kind: NotificationKind,
  payload: { taskId?: number; disciplinaId?: string; avaliacao?: string; nota?: number }
): string {
  if (kind === "task" && payload.taskId !== undefined) {
    return buildTaskNotificationFingerprint(payload.taskId);
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
