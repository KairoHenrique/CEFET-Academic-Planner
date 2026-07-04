import type { SyncMode } from "@/lib/types/sync-pipeline";

export type SyncQueueLane = "priority" | "normal";
export type SyncJobStatus = "queued" | "running" | "completed" | "failed";
export type SyncJobTrigger = "first_login" | "manual" | "auto";

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

export interface EnqueueSyncQueueBody {
  username: string;
  password?: string;
  mode?: SyncMode;
  lane?: SyncQueueLane;
  trigger: SyncJobTrigger;
  savePassword?: boolean;
  idempotencyKey?: string;
}

export interface EnqueueSyncQueueResponse {
  ok: true;
  reused: boolean;
  job: SyncQueueJobView;
}

export interface GetSyncQueueJobResponse {
  ok: true;
  job: SyncQueueJobView;
}
