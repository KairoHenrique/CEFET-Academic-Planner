import type {
  AccountAuthResponse,
  LoginAccountBody,
  PerfilResponse,
  RefreshAccountBody,
  RefreshAuthResponse,
  SubscriptionAccessView,
} from "@acme/api-contracts";
import { getApiBaseUrl } from "../config/env";
import { clearLocalAppData } from "./logout";
import {
  applySessionTokens,
  buildAuthHeaders,
  clearSession,
  getSession,
  persistFromAuthResponse,
  updateSubscription,
  type MobileAuthSession,
} from "./session";

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

async function parseJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

export async function requestJson<T>(
  path: string,
  init: RequestInit & { auth?: boolean } = {}
): Promise<T> {
  const base = getApiBaseUrl();
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(init.body ? { "Content-Type": "application/json" } : {}),
    ...(init.headers as Record<string, string> | undefined),
  };

  if (init.auth !== false) {
    Object.assign(headers, buildAuthHeaders());
  }

  const response = await fetch(`${base}${path}`, {
    ...init,
    headers,
  });

  const payload = await parseJson(response);

  if (!response.ok) {
    const err = payload as { message?: string; code?: string } | null;
    throw new ApiClientError(
      err?.message ?? `HTTP ${response.status}`,
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
  return persistFromAuthResponse(auth);
}

/** Logout local: tokens + cache/push (hooks M5/M6). */
export async function logoutLocal(): Promise<void> {
  await clearLocalAppData();
  await clearSession();
}

/** Monta URL absoluta para abrir planos no browser. */
export function resolveWebHref(href: string): string {
  if (/^https?:\/\//i.test(href)) return href;
  const base = getApiBaseUrl();
  return `${base}${href.startsWith("/") ? href : `/${href}`}`;
}
