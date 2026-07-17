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

/** Registro interno do servidor — nunca expor `cpf` na API do painel. */
export interface DevAccountRecord {
  userId?: string | null;
  cpf: string;
  cpfMasked: string;
  cpfLast4: string;
  displayName: string;
  matricula: string | null;
  cursoId: AppCursoId | string;
  email: string | null;
  credentialSaved: boolean;
  lastSyncAt: string | null;
  subscription: DevAccountSubscriptionView | null;
}

/** Resposta pública autenticada do operador — sem CPF completo. */
export interface DevAccountPublicView {
  accountRef: string;
  cpfMasked: string;
  cpfLast4: string;
  displayName: string;
  matricula: string | null;
  cursoId: AppCursoId | string;
  email: string | null;
  credentialSaved: boolean;
  lastSyncAt: string | null;
  subscription: DevAccountSubscriptionView | null;
}

/** @deprecated Use DevAccountRecord (server) / DevAccountPublicView (API). */
export type DevAccountView = DevAccountPublicView;

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
  finishedAt?: string | null;
  robot?: string;
  errorCode?: string | null;
  errorMessage?: string | null;
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
    failed: DevQueueJobView[];
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
  accountRef?: string;
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

export interface DevGrantSubscriptionRequest {
  accountRef: string;
  planId: string;
  days: number;
}

export interface DevGrantSubscriptionResult {
  planId: string;
  planLabel: string;
  cpfLast4: string;
  subscription: {
    id: string;
    status: "active";
    expiresAt: string;
    daysGranted: number;
  };
}

export interface DevSubscriptionHistoryItem {
  id: string;
  planId: string;
  planLabel: string;
  status: string;
  source: string;
  startedAt: string;
  expiresAt: string;
  createdAt: string;
}

export interface DevSubscriptionHistoryResponse {
  accountRef: string;
  cpfLast4: string;
  subscriptions: DevSubscriptionHistoryItem[];
}

export interface DevRevokeSubscriptionResult {
  accountRef: string;
  cpfLast4: string;
  cancelled: number;
}

export interface DevOpsActionResult {
  ok: true;
  message: string;
  detail?: Record<string, unknown>;
}

export interface DevSyncJobRetryResult {
  ok: true;
  jobId: string;
  reused: boolean;
  message: string;
}

export interface DevGiftKeyView {
  code: string;
  planId: string;
  durationDays: number;
  status: string;
  keyExpiresAt: string | null;
  redeemedByCpf: string | null;
  redeemedAt: string | null;
  internalLabel: string | null;
  createdAt: string;
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
