import type { SyncMode } from "@/lib/types/sync-pipeline";

/** r1 = pipeline completo por usuário · turmas/calendario = catálogo global (B72e). */
export type WorkerRobotId = "r1" | "turmas" | "calendario";

/** sync = responde ao fim do job · async = 202 imediato + status na fila Postgres (B72e). */
export type WorkerJobExecution = "sync" | "async";

export interface WorkerJobRequest {
  jobId: string;
  robot: WorkerRobotId;
  username: string;
  /** Legado/testes — preferir passwordEnc na rede interna. */
  password?: string;
  /** Senha AES-GCM selada (B56) — tráfego API → worker sem plaintext. */
  passwordEnc?: string;
  mode?: SyncMode;
  savePassword?: boolean;
  execution?: WorkerJobExecution;
}

export interface WorkerJobAccepted {
  ok: true;
  jobId: string;
  status: "queued";
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
