import type { AppCursoId } from "@/lib/auth/account/types";
import type { PerfilSubscriptionStatus } from "@/lib/types/perfil-api";
import type { EffectiveSyncPolicy, SyncPolicyOverrides } from "@/lib/sync-policy/types";
import type {
  SyncJobStatus,
  SyncJobTrigger,
  SyncQueueLane,
} from "@/lib/sync-queue/types";
import type { SyncMode } from "@/lib/types/sync-pipeline";

export interface DevOperatorSession {
  email: string;
  issuedAt: string;
  expiresAt: string;
}

export interface DevAccountSubscriptionView {
  planId: string;
  planLabel: string;
  status: PerfilSubscriptionStatus;
  expiresAt: string;
  daysRemaining: number;
  trialStartedAt: string | null;
}

export interface DevAccountView {
  /** Apenas resposta autenticada do operador — uso interno do painel. */
  cpf: string;
  cpfMasked: string;
  cpfLast4: string;
  displayName: string;
  cursoId: AppCursoId | string;
  email: string | null;
  hasSigaaPassword: boolean;
  lastSyncAt: string | null;
  subscription: DevAccountSubscriptionView | null;
}

export interface DevQueueJobView {
  jobId: string;
  cpfMasked: string;
  lane: SyncQueueLane;
  trigger: SyncJobTrigger;
  mode: SyncMode;
  status: SyncJobStatus;
  position: number;
  etaSeconds: number;
  createdAt: string;
  startedAt: string | null;
}

export interface DevOrchestratorPlanItem {
  order: number;
  label: string;
  reason: string;
}

export interface DevSyncStatusResponse {
  queue: {
    running: DevQueueJobView[];
    queued: DevQueueJobView[];
  };
  orchestrator: {
    inNightlyWindow: boolean;
    lastTickAt: string | null;
    nextActions: DevOrchestratorPlanItem[];
    policySummary: {
      nightlyEnabled: boolean;
      nightlyWindow: string;
      autoIntervalHours: number;
      workerMaxConcurrent: number;
    };
  };
}

export interface DevRobotsSelection {
  r1: boolean;
  r2: boolean;
  r3: boolean;
}

export type DevRobotScope = "individual" | "global";

export interface DevRobotRunRequest {
  scope: DevRobotScope;
  cpf?: string;
  robots: DevRobotsSelection;
  mode?: "full" | "lite" | "deep";
}

export interface DevRobotTargetResult {
  cpfMasked: string;
  robot: "r1" | "r2" | "r3";
  status: "ok" | "skipped" | "failed";
  message: string;
  jobId?: string;
}

export interface DevRobotRunResult {
  scope: DevRobotScope;
  results: DevRobotTargetResult[];
}

export interface DevSyncPolicyResponse {
  effective: EffectiveSyncPolicy;
  overrides: SyncPolicyOverrides | null;
}

export interface DevAuditEntry {
  id: string;
  at: string;
  operatorEmail: string;
  action: string;
  detail: Record<string, unknown>;
}
