import type { SyncMode } from "@/lib/types/sync-pipeline";

const SYNC_MODES: SyncMode[] = ["full", "lite", "deep", "incremental"];

export function normalizeSyncMode(
  mode: string | undefined | null,
  fallback: SyncMode = "lite"
): SyncMode {
  const value = mode?.trim().toLowerCase();
  if (value === "full") return "full";
  if (value === "deep") return "deep";
  if (value === "lite" || value === "incremental") return "lite";
  return fallback;
}

export function isSyncMode(value: string): value is SyncMode {
  return (SYNC_MODES as string[]).includes(value);
}

export function resolveSyncModeForTrigger(input: {
  trigger: "first_login" | "manual" | "auto" | "dev";
  requestedMode?: string | null;
  buttonScope?: "lite" | "full";
}): SyncMode {
  if (input.trigger === "first_login") {
    return "full";
  }

  if (input.requestedMode) {
    return normalizeSyncMode(input.requestedMode);
  }

  if (input.trigger === "manual" || input.trigger === "auto") {
    return input.buttonScope === "full" ? "full" : "lite";
  }

  return "lite";
}

export function shouldRunHistoricoForMode(mode: SyncMode): boolean {
  const normalized = normalizeSyncMode(mode);
  if (normalized === "full" || normalized === "deep") return true;
  return false;
}

export type TurmaSubpageKey = "notas" | "frequencia" | "grupo" | "tarefas";

export function resolveTurmaSubpagesForMode(mode: SyncMode): TurmaSubpageKey[] {
  const normalized = normalizeSyncMode(mode);
  if (normalized === "lite") {
    return ["notas", "tarefas", "frequencia"];
  }
  return ["notas", "frequencia", "grupo", "tarefas"];
}
