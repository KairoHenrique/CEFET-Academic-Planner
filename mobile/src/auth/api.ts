import type {
  AccountAuthResponse,
  AuthConfigResponse,
  LoginAccountBody,
  PerfilResponse,
  RefreshAccountBody,
  RefreshAuthResponse,
  RegisterAccountBody,
  SubscriptionAccessView,
} from "@acme/api-contracts";
import { getApiBaseUrl } from "../config/env";
import {
  applySessionTokens,
  buildAuthHeaders,
  clearSession,
  getSession,
  persistFromAuthResponse,
  updateSubscription,
  type MobileAuthSession,
} from "./session";
import { queuePostAuthNavigation } from "./post-auth-nav";

export class ApiClientError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.code = code;
  }
}

let isMaintenanceMode = false;
export function setMaintenanceMode(enabled: boolean) {
  isMaintenanceMode = enabled;
}

async function parseJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

const TRANSIENT_STATUS = new Set([500, 502, 503, 504]);
const MAX_RETRIES = 2;
const RETRY_BASE_MS = 800;

function friendlyErrorMessage(status: number, serverMsg?: string | null): string {
  if (serverMsg && serverMsg !== `HTTP ${status}`) return serverMsg;
  if (status === 503) return "Servidor temporariamente indisponível. Tente novamente em instantes.";
  if (status === 500) return "Erro interno do servidor. Tente novamente.";
  if (status === 502) return "Falha na comunicação com o servidor.";
  if (status === 504) return "O servidor demorou para responder. Tente novamente.";
  if (status === 401) return "Sessão expirada. Faça login novamente.";
  if (status === 403) return "Acesso negado.";
  return `Erro inesperado (${status}). Tente novamente.`;
}

function isRetriableMethod(init?: RequestInit): boolean {
  const method = (init?.method ?? "GET").toUpperCase();
  return method === "GET" || method === "HEAD";
}

async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function requestJson<T>(
  path: string,
  init: RequestInit & { auth?: boolean } = {}
): Promise<T> {
  const base = getApiBaseUrl();

  if (isMaintenanceMode && !path.includes("/api/maintenance")) {
    throw new ApiClientError("Aplicativo em manutenção.", 503, "MAINTENANCE");
  }

  if (init.auth !== false) {
    await ensureFreshSession().catch(() => null);
  }

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(init.body ? { "Content-Type": "application/json" } : {}),
    ...(init.headers as Record<string, string> | undefined),
  };

  if (init.auth !== false) {
    Object.assign(headers, buildAuthHeaders());
  }

  const canRetry = isRetriableMethod(init);
  let lastError: ApiClientError | null = null;

  for (let attempt = 0; attempt <= (canRetry ? MAX_RETRIES : 0); attempt++) {
    if (attempt > 0) {
      await delay(RETRY_BASE_MS * attempt);
    }

    let response: Response;
    try {
      response = await fetch(`${base}${path}`, {
        ...init,
        headers,
      });
    } catch (networkErr) {
      // Erro de rede (offline, DNS, timeout) — retenta se possível
      lastError = new ApiClientError(
        "Não foi possível conectar ao servidor. Verifique sua conexão.",
        0,
        "NETWORK_ERROR"
      );
      if (canRetry && attempt < MAX_RETRIES) continue;
      throw lastError;
    }

    const payload = await parseJson(response);

    if (!response.ok) {
      const err = payload as { message?: string; code?: string } | null;

      // Para erros transitórios, retenta automaticamente
      if (canRetry && TRANSIENT_STATUS.has(response.status) && attempt < MAX_RETRIES) {
        lastError = new ApiClientError(
          friendlyErrorMessage(response.status, err?.message),
          response.status,
          err?.code
        );
        continue;
      }

      throw new ApiClientError(
        friendlyErrorMessage(response.status, err?.message),
        response.status,
        err?.code
      );
    }

    return payload as T;
  }

  // Fallback — não deveria chegar aqui
  throw lastError ?? new ApiClientError("Erro desconhecido.", 0, "UNKNOWN");
}

/** Multipart (FormData) — não define Content-Type (boundary automático). */
export async function requestForm<T>(
  path: string,
  form: FormData,
  init: RequestInit & { auth?: boolean } = {}
): Promise<T> {
  const base = getApiBaseUrl();

  if (init.auth !== false) {
    await ensureFreshSession().catch(() => null);
  }

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(init.headers as Record<string, string> | undefined),
  };

  if (init.auth !== false) {
    Object.assign(headers, buildAuthHeaders());
  }

  const response = await fetch(`${base}${path}`, {
    ...init,
    method: init.method ?? "POST",
    headers,
    body: form,
  });

  const payload = await parseJson(response);
  if (!response.ok) {
    const err = payload as { message?: string; code?: string } | null;
    throw new ApiClientError(
      friendlyErrorMessage(response.status, err?.message),
      response.status,
      err?.code
    );
  }

  return payload as T;
}

export async function postAuthLogin(
  body: LoginAccountBody
): Promise<AccountAuthResponse> {
  return requestJson<AccountAuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(body),
    auth: false,
  });
}

export async function postAuthRegister(
  body: RegisterAccountBody
): Promise<AccountAuthResponse> {
  return requestJson<AccountAuthResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(body),
    auth: false,
  });
}

export async function getAuthConfig(): Promise<AuthConfigResponse> {
  return requestJson<AuthConfigResponse>("/api/auth/config", {
    auth: false,
  });
}

export async function postAuthRefresh(
  body: RefreshAccountBody
): Promise<RefreshAuthResponse> {
  return requestJson<RefreshAuthResponse>("/api/auth/refresh", {
    method: "POST",
    body: JSON.stringify(body),
    auth: false,
  });
}

export async function getPerfil(): Promise<PerfilResponse> {
  return requestJson<PerfilResponse>("/api/perfil");
}

function perfilToSubscriptionView(
  perfil: PerfilResponse
): SubscriptionAccessView {
  const sub = perfil.subscription;
  return {
    planId: sub.planId,
    planLabel: sub.planLabel,
    status: sub.status,
    expiresAt: sub.expiresAt,
    daysRemaining: sub.daysRemaining,
    renewHref: sub.renewHref,
    inGracePeriod: sub.inGracePeriod,
    renewalEligible: sub.renewalEligible,
  };
}

/** Atualiza snapshot de assinatura via GET /api/perfil (isento do gate server). */
export async function syncSubscriptionFromPerfil(): Promise<MobileAuthSession | null> {
  if (!getSession()) return null;
  const perfil = await getPerfil();
  
  if (perfil.account?.sigaaAuthError) {
    await clearSession();
    return null;
  }

  return updateSubscription(perfilToSubscriptionView(perfil));
}

const REFRESH_SKEW_SEC = 120;

export function isAccessTokenFresh(
  session: MobileAuthSession | null,
  nowSec = Math.floor(Date.now() / 1000)
): boolean {
  if (!session?.expiresAt) return false;
  return session.expiresAt - nowSec > REFRESH_SKEW_SEC;
}

export async function ensureFreshSession(
  options: { force?: boolean } = {}
): Promise<MobileAuthSession | null> {
  const current = getSession();
  if (!current) return null;

  if (!options.force && isAccessTokenFresh(current)) {
    return current;
  }

  try {
    const refreshed = await postAuthRefresh({
      refreshToken: current.refreshToken,
    });
    return applySessionTokens(current, refreshed.session);
  } catch (error) {
    if (
      error instanceof ApiClientError &&
      (error.status === 401 || error.code === "UNAUTHORIZED")
    ) {
      await clearSession();
      return null;
    }
    throw error;
  }
}

export async function loginAndPersist(
  body: LoginAccountBody
): Promise<MobileAuthSession> {
  const auth = await postAuthLogin(body);
  const session = await persistFromAuthResponse(auth);
  const { saveSigaaPassword } = await import(
    "../device-sync/sigaa-password-store"
  );
  await saveSigaaPassword(body.password);
  queuePostAuthNavigation(session.subscription.status);
  return session;
}

export async function registerAndPersist(
  body: RegisterAccountBody
): Promise<MobileAuthSession> {
  const auth = await postAuthRegister(body);
  const session = await persistFromAuthResponse(auth);
  const { saveSigaaPassword } = await import(
    "../device-sync/sigaa-password-store"
  );
  await saveSigaaPassword(body.password);
  queuePostAuthNavigation(session.subscription.status);
  return session;
}

/** Monta URL absoluta para abrir planos no browser. */
export function resolveWebHref(href: string): string {
  if (/^https?:\/\//i.test(href)) return href;
  const base = getApiBaseUrl();
  return `${base}${href.startsWith("/") ? href : `/${href}`}`;
}
