export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "INVALID_CREDENTIALS"
  | "SIGAA_OFFLINE"
  | "NOT_FOUND"
  | "INTERNAL_ERROR";

export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly status: number;
  readonly details?: unknown;

  constructor(
    code: ApiErrorCode,
    message: string,
    status: number,
    details?: unknown
  ) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export function validationError(message: string, details?: unknown): ApiError {
  return new ApiError("VALIDATION_ERROR", message, 400, details);
}

export function notFoundError(message: string): ApiError {
  return new ApiError("NOT_FOUND", message, 404);
}

export function internalError(message = "Erro interno do servidor."): ApiError {
  return new ApiError("INTERNAL_ERROR", message, 500);
}
