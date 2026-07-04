import type { SyncMode } from "@/lib/types/sync-pipeline";

export type WorkerRobotId = "r1";

export interface WorkerJobRequest {
  jobId: string;
  robot: WorkerRobotId;
  username: string;
  password: string;
  mode?: SyncMode;
  savePassword?: boolean;
}

export interface WorkerJobSuccess {
  jobId: string;
  status: "completed";
  durationMs: number;
  partial?: boolean;
  steps: Array<{ label: string; progress: number }>;
}

export interface WorkerJobFailure {
  jobId: string;
  status: "failed";
  durationMs: number;
  error: {
    code: string;
    message: string;
  };
}

export type WorkerJobResult = WorkerJobSuccess | WorkerJobFailure;

export interface WorkerStatusResponse {
  ok: true;
  busy: boolean;
  uptimeMs: number;
  acceptingJobs: boolean;
  currentJobId: string | null;
  slot: {
    maxConcurrent: number;
    activeSlots: number;
    queued: number;
  };
}
