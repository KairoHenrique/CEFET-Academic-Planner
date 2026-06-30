import type { SemestreAtualRow } from "@/lib/types/db";

export const SUBJECT_ROOM_MAX_LENGTH = 40;

export function sanitizeSubjectRoom(value: string): string | null {
  const trimmed = value.trim().replace(/\s+/g, " ");
  if (!trimmed) return null;
  return trimmed.slice(0, SUBJECT_ROOM_MAX_LENGTH);
}

export function resolveSubjectSyncedRoom(semestre: Pick<SemestreAtualRow, "local">): string | null {
  const synced = semestre.local?.trim();
  return synced || null;
}

export function resolveSubjectDisplayRoom(
  semestre: Pick<SemestreAtualRow, "local" | "local_exibicao">
): string {
  const custom = semestre.local_exibicao?.trim();
  if (custom) return custom;
  return resolveSubjectSyncedRoom(semestre) ?? "—";
}
