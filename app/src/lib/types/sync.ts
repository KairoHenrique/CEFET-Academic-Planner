export interface SyncStep {
  label: string;
  progress: number;
}

export interface SyncRequest {
  username: string;
  password: string;
  savePassword?: boolean;
}

export interface SyncSuccessResponse {
  ok: true;
  steps: SyncStep[];
}

export type SyncErrorCode =
  | "INVALID_CREDENTIALS"
  | "SIGAA_OFFLINE"
  | "SIGAA_TIMEOUT"
  | "SIGAA_AUTH_FAILED"
  | "VALIDATION_ERROR";

export interface SyncErrorResponse {
  ok: false;
  code: SyncErrorCode;
  message: string;
}

export type SyncResponse = SyncSuccessResponse | SyncErrorResponse;
