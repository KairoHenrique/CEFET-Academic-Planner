import type { SyncStep } from "@/lib/types/sync";

/** Escopos R1 — §6.6 SCOPE-CLOUD. `incremental` = alias legado de `lite`. */
export type SyncMode = "full" | "lite" | "deep" | "incremental";

export type SyncStageName = "portal" | "historico" | "turma" | "ru";

export type SyncStageOutcome = "ok" | "warning" | "skipped";

export interface SyncStageResult {
  stage: SyncStageName;
  outcome: SyncStageOutcome;
  message?: string;
}

export interface SyncPipelineResult {
  steps: SyncStep[];
  stages: SyncStageResult[];
  partial: boolean;
}
