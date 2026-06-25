export interface SyncStep {
  label: string;
  progress: number;
}

export interface SyncRequest {
  username: string;
  password: string;
}

export interface SyncSuccessResponse {
  ok: true;
  steps: SyncStep[];
}

export type SyncErrorCode = "INVALID_CREDENTIALS" | "SIGAA_OFFLINE" | "VALIDATION_ERROR";

export interface SyncErrorResponse {
  ok: false;
  code: SyncErrorCode;
  message: string;
}

export type SyncResponse = SyncSuccessResponse | SyncErrorResponse;
