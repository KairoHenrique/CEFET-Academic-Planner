import { ApiClientError, type ClientErrorCode } from "@/lib/api/client";
import type {
  DevAccountPublicView,
  DevAuditEntry,
  DevRobotRunRequest,
  DevRobotRunResult,
  DevSyncPolicyResponse,
  DevSyncStatusResponse,
} from "@/lib/dev-panel/types";
import type { SyncPolicyOverrides } from "@/lib/sync-policy/types";

interface ApiFailureBody {
  ok?: false;
  code?: ClientErrorCode;
  message?: string;
}

async function devRequestJson<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(path, {
      ...init,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...init?.headers,
      },
    });
  } catch {
    throw new ApiClientError(
      "Não foi possível conectar ao servidor.",
      "NETWORK_ERROR",
      0
    );
  }

  let body: T & ApiFailureBody;
  try {
    body = (await response.json()) as T & ApiFailureBody;
  } catch {
    throw new ApiClientError(
      "Resposta inválida do servidor.",
      "UNKNOWN",
      response.status
    );
  }

  if (!response.ok) {
    throw new ApiClientError(
      body.message ?? "Falha na requisição.",
      body.code ?? "INTERNAL_ERROR",
      response.status
    );
  }

  return body;
}

export async function postDevLogin(input: {
  email: string;
  password: string;
}): Promise<{ ok: true; email: string }> {
  return devRequestJson("/api/dev/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function postDevLogout(): Promise<{ ok: true }> {
  return devRequestJson("/api/dev/auth/logout", {
    method: "POST",
  });
}

export async function getDevSession(): Promise<{ ok: true; email: string }> {
  return devRequestJson("/api/dev/auth/session");
}

export async function getDevAccounts(
  query?: string
): Promise<{ ok: true; accounts: DevAccountPublicView[] }> {
  const params = query?.trim()
    ? `?q=${encodeURIComponent(query.trim())}`
    : "";
  return devRequestJson(`/api/dev/accounts${params}`);
}

export async function getDevSyncPolicy(): Promise<
  { ok: true } & DevSyncPolicyResponse
> {
  return devRequestJson("/api/dev/sync-policy");
}

export async function patchDevSyncPolicy(
  patch: SyncPolicyOverrides
): Promise<{ ok: true } & DevSyncPolicyResponse> {
  return devRequestJson("/api/dev/sync-policy", {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export async function resetDevSyncPolicy(): Promise<
  { ok: true } & DevSyncPolicyResponse
> {
  return devRequestJson("/api/dev/sync-policy/reset", {
    method: "POST",
  });
}

export async function postDevRobotsRun(
  body: DevRobotRunRequest
): Promise<{ ok: true } & DevRobotRunResult> {
  return devRequestJson("/api/dev/robots/run", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function getDevSyncStatus(): Promise<
  { ok: true } & DevSyncStatusResponse
> {
  return devRequestJson("/api/dev/sync-status");
}

export async function getDevAuditLog(
  limit = 20
): Promise<{ ok: true; entries: DevAuditEntry[] }> {
  return devRequestJson(`/api/dev/audit-log?limit=${limit}`);
}
