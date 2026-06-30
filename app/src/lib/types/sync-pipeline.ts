import type { SyncStep } from "@/lib/types/sync";

export type SyncMode = "full" | "incremental";

export type SyncStageName = "portal" | "historico" | "turma";

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
