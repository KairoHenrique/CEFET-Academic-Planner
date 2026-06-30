export type SyncMode = "full" | "incremental";

export interface SyncStep {
  label: string;
  progress: number;
}

export interface SyncRequest {
  username: string;
  password: string;
  savePassword?: boolean;
  mode?: SyncMode;
}

export interface SyncSuccessResponse {
  ok: true;
  steps: SyncStep[];
  partial?: boolean;
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
