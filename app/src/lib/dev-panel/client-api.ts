import { ApiClientError, type ClientErrorCode } from "@/lib/api/client";
import type {
  DevAccountPublicView,
  DevAuditEntry,
  DevGiftKeyView,
  DevGrantSubscriptionRequest,
  DevGrantSubscriptionResult,
  DevOpsActionResult,
  DevPromotionRequest,
  DevPromotionResult,
  DevSitePromoClearResult,
  DevRevokeSubscriptionResult,
  DevRobotRunRequest,
  DevRobotRunResult,
  DevSubscriptionHistoryResponse,
  DevSyncJobRetryResult,
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

export async function postDevGrantSubscription(
  body: DevGrantSubscriptionRequest
): Promise<{ ok: true } & DevGrantSubscriptionResult> {
  return devRequestJson("/api/dev/subscriptions/grant", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

interface GiftKeyApiRow {
  code: string;
  plan_id: string;
  duration_days: number;
  status: string;
  key_expires_at: string | null;
  redeemed_by_cpf: string | null;
  redeemed_at: string | null;
  internal_label: string | null;
  created_at: string;
}

function mapGiftKeyRowToView(row: GiftKeyApiRow): DevGiftKeyView {
  return {
    code: row.code,
    planId: row.plan_id,
    durationDays: row.duration_days,
    status: row.status,
    keyExpiresAt: row.key_expires_at,
    redeemedByCpf: row.redeemed_by_cpf,
    redeemedAt: row.redeemed_at,
    internalLabel: row.internal_label,
    createdAt: row.created_at,
  };
}

export async function getDevGiftKeys(limit = 100): Promise<DevGiftKeyView[]> {
  const response = await devRequestJson<{ ok: true; keys: GiftKeyApiRow[] }>(
    `/api/dev/gift-keys?limit=${limit}`
  );
  return response.keys.map(mapGiftKeyRowToView);
}

/** Gera 1..N códigos de plano (gift keys) com rótulo interno opcional. */
export async function postDevCreateGiftKeys(body: {
  planId: string;
  days: number;
  count: number;
  label?: string;
}): Promise<DevGiftKeyView[]> {
  const response = await devRequestJson<{
    ok: true;
    count: number;
    keys: GiftKeyApiRow[];
  }>("/api/dev/gift-keys", {
    method: "POST",
    body: JSON.stringify({
      planId: body.planId,
      durationDays: body.days,
      count: body.count,
      internalLabel: body.label?.trim() || undefined,
    }),
  });

  return response.keys.map(mapGiftKeyRowToView);
}

export async function patchDevRevokeGiftKey(
  code: string
): Promise<DevGiftKeyView> {
  const response = await devRequestJson<{ ok: true; key: GiftKeyApiRow }>(
    `/api/dev/gift-keys/${encodeURIComponent(code)}`,
    { method: "PATCH" }
  );
  return mapGiftKeyRowToView(response.key);
}

export async function postDevDispatchPromotion(
  body: DevPromotionRequest
): Promise<{ ok: true } & DevPromotionResult> {
  return devRequestJson("/api/dev/promotions", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function deleteDevSitePromo(): Promise<DevSitePromoClearResult> {
  return devRequestJson("/api/dev/promotions", { method: "DELETE" });
}

export async function postDevOrchestratorTick(): Promise<DevOpsActionResult> {
  return devRequestJson("/api/dev/orchestrator/tick", { method: "POST" });
}

export async function postDevAccountEmailsCron(): Promise<DevOpsActionResult> {
  return devRequestJson("/api/dev/cron/account-emails", { method: "POST" });
}

export async function postDevRetrySyncJob(
  jobId: string
): Promise<DevSyncJobRetryResult> {
  return devRequestJson("/api/dev/sync-jobs/retry", {
    method: "POST",
    body: JSON.stringify({ jobId }),
  });
}

export async function getDevSubscriptions(
  accountRef: string
): Promise<{ ok: true } & DevSubscriptionHistoryResponse> {
  return devRequestJson(
    `/api/dev/subscriptions?accountRef=${encodeURIComponent(accountRef)}`
  );
}

export async function postDevRevokeSubscription(
  accountRef: string
): Promise<{ ok: true } & DevRevokeSubscriptionResult> {
  return devRequestJson("/api/dev/subscriptions/revoke", {
    method: "POST",
    body: JSON.stringify({ accountRef }),
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
