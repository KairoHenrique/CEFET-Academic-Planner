import type { SyncMode } from "@/lib/types/sync-pipeline";

export type SyncQueueLane = "priority" | "normal";
export type SyncJobStatus = "queued" | "running" | "completed" | "failed";
export type SyncJobTrigger = "first_login" | "manual" | "auto";

export interface EnqueueSyncJobInput {
  username: string;
  password: string;
  mode?: SyncMode;
  lane: SyncQueueLane;
  trigger: SyncJobTrigger;
  savePassword?: boolean;
  idempotencyKey?: string;
}

export interface SyncQueueJobRecord {
  id: string;
  username: string;
  lane: SyncQueueLane;
  trigger: SyncJobTrigger;
  mode: SyncMode;
  status: SyncJobStatus;
  savePassword: number;
  idempotencyKey: string | null;
  passwordEnc: string;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  resultJson: string | null;
  errorCode: string | null;
  errorMessage: string | null;
}

export interface SyncQueueJobView {
  jobId: string;
  username: string;
  lane: SyncQueueLane;
  trigger: SyncJobTrigger;
  mode: SyncMode;
  status: SyncJobStatus;
  position: number;
  etaSeconds: number;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  result?: {
    steps: Array<{ label: string; progress: number }>;
    partial?: boolean;
  };
  error?: {
    code: string;
    message: string;
  };
}

export interface EnqueueSyncJobResult {
  job: SyncQueueJobView;
  reused: boolean;
}

export const SYNC_QUEUE_MANUAL_COOLDOWN_MS = 5 * 60 * 1000;
export const SYNC_QUEUE_DEFAULT_ETA_SECONDS = 4 * 60;
