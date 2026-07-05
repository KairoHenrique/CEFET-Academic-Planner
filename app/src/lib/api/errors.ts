export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "INVALID_CREDENTIALS"
  | "ACCOUNT_EXISTS"
  | "AUTH_UNAVAILABLE"
  | "UNAUTHORIZED"
  | "SUBSCRIPTION_REQUIRED"
  | "SIGAA_OFFLINE"
  | "SIGAA_TIMEOUT"
  | "SIGAA_AUTH_FAILED"
  | "SIGAA_SCRAPE_FAILED"
  | "NOT_FOUND"
  | "RATE_LIMITED"
  | "SQLITE_DISABLED"
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

export function sqliteDisabledError(
  message = "SQLite local indisponível no modo cloud/postgres."
): ApiError {
  return new ApiError("SQLITE_DISABLED", message, 503);
}

export function invalidCredentialsError(
  message = "Credenciais inválidas."
): ApiError {
  return new ApiError("INVALID_CREDENTIALS", message, 401);
}

export function accountExistsError(
  message = "Conta já cadastrada."
): ApiError {
  return new ApiError("ACCOUNT_EXISTS", message, 409);
}

export function authUnavailableError(
  message = "Autenticação cloud indisponível."
): ApiError {
  return new ApiError("AUTH_UNAVAILABLE", message, 503);
}

export function unauthorizedError(
  message = "Não autenticado."
): ApiError {
  return new ApiError("UNAUTHORIZED", message, 401);
}

export function subscriptionRequiredError(
  message = "Assinatura necessária para continuar.",
  details?: unknown
): ApiError {
  return new ApiError("SUBSCRIPTION_REQUIRED", message, 403, details);
}

export function internalError(message = "Erro interno do servidor."): ApiError {
  return new ApiError("INTERNAL_ERROR", message, 500);
}
