import { ApiError, type ApiErrorCode } from "@/lib/api/errors";

export type ScraperErrorCode =
  | "INVALID_CREDENTIALS"
  | "SIGAA_OFFLINE"
  | "SIGAA_TIMEOUT"
  | "SIGAA_AUTH_FAILED"
  | "SIGAA_SCRAPE_FAILED";

const SCRAPER_STATUS: Record<ScraperErrorCode, number> = {
  INVALID_CREDENTIALS: 401,
  SIGAA_OFFLINE: 503,
  SIGAA_TIMEOUT: 504,
  SIGAA_AUTH_FAILED: 502,
  SIGAA_SCRAPE_FAILED: 502,
};

export class ScraperError extends Error {
  readonly code: ScraperErrorCode;
  readonly details?: unknown;

  constructor(code: ScraperErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = "ScraperError";
    this.code = code;
    this.details = details;
  }

  toApiError(): ApiError {
    return new ApiError(
      this.code as ApiErrorCode,
      this.message,
      SCRAPER_STATUS[this.code],
      this.details
    );
  }

  static invalidCredentials(
    message = "Usuário ou senha inválidos. Verifique suas credenciais do SIGAA."
  ): ScraperError {
    return new ScraperError("INVALID_CREDENTIALS", message);
  }

  static offline(
    message = "SIGAA indisponível no momento. Tente novamente mais tarde."
  ): ScraperError {
    return new ScraperError("SIGAA_OFFLINE", message);
  }

  static timeout(
    message = "Tempo esgotado ao conectar ao SIGAA. Tente novamente."
  ): ScraperError {
    return new ScraperError("SIGAA_TIMEOUT", message);
  }

  static authFailed(message: string): ScraperError {
    return new ScraperError("SIGAA_AUTH_FAILED", message);
  }

  static scrapeFailed(
    message = "Não foi possível extrair dados do portal do discente."
  ): ScraperError {
    return new ScraperError("SIGAA_SCRAPE_FAILED", message);
  }
}

export function mapUnknownScraperError(error: unknown): ScraperError {
  if (error instanceof ScraperError) {
    return error;
  }

  const message = error instanceof Error ? error.message : String(error);
  const normalized = message.toLowerCase();

  if (
    normalized.includes("timeout") ||
    normalized.includes("timed out") ||
    normalized.includes("timeouterror")
  ) {
    return ScraperError.timeout();
  }

  if (
    normalized.includes("net::err") ||
    normalized.includes("econnrefused") ||
    normalized.includes("enotfound") ||
    normalized.includes("network")
  ) {
    return ScraperError.offline();
  }

  return ScraperError.scrapeFailed(
    message || "Não foi possível extrair dados do SIGAA. Tente novamente."
  );
}
