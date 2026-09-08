import type { DashboardResponse } from "@/lib/types/dashboard";
import type {
  CreateTarefaBody,
  DisciplinaListFilter,
  DisciplinaListResponse,
  PatchFaltaBody,
  PatchFaltaResponse,
  PatchNotasBody,
  PatchNotasResponse,
  PatchTarefaBody,
  SubjectDetailResponse,
  PatchDisciplinaAppearanceBody,
  PatchDisciplinaAppearanceResponse,
} from "@/lib/types/disciplinas-api";
import type { AcademicTask } from "@/lib/types/task";
import type { SyncRequest, SyncSuccessResponse, SyncMode } from "@/lib/types/sync";
import type {
  EnqueueSyncQueueBody,
  EnqueueSyncQueueResponse,
  GetSyncQueueJobResponse,
  SyncQueueJobView,
} from "@/lib/types/sync-queue-api";
import { getSession } from "@/lib/auth/session";

export interface SyncReadinessResponse {
  ok: true;
  canFastLogin: boolean;
  reason: "ready" | "no_data";
}

export type { SyncMode };
import type { CalendarEvent } from "@/lib/types/calendar";
import type {
  CalendarResponse,
  CreateCalendarEventBody,
  PatchCalendarEventBody,
  PatchCalendarEventResponse,
} from "@/lib/types/calendar-api";
import type {
  IntegralizacaoResponse,
  PostIntegralizacaoBody,
} from "@/lib/types/integralizacao-api";
import type { MapaResponse } from "@/lib/types/mapa-api";
import type { MapaGrafoResponse } from "@/lib/types/mapa-grafo-api";
import type { NotificationsSnapshotResponse } from "@/lib/types/notifications-api";
import type { PerfilResponse, PatchPerfilBody } from "@/lib/types/perfil-api";
import type { ScheduleApiResponse } from "@/lib/types/schedule-api";
import type {
  AccountAuthResponse,
  AuthConfigResponse,
  LoginAccountBody,
  RegisterAccountBody,
} from "@/lib/types/auth-api";
import type {
  TurmasOfertadasResponse,
  TurmasOfertadasSyncResponse,
} from "@/lib/types/turmas-ofertadas-api";
import type {
  BillingAccountResponse,
  BillingCheckoutRequestBody,
  BillingCheckoutResponse,
  BillingPaymentStatusResponse,
  BillingPlansResponse,
  RedeemGiftKeyRequestBody,
  RedeemGiftKeyResponse,
} from "@/lib/types/billing-api";
import type {
  SimuladorChoquesRequestBody,
  SimuladorChoquesResponse,
  SimuladorSaveSimulationRequestBody,
  SimuladorSaveSimulationResponse,
  SimuladorSimulationDetail,
  SimuladorSimulacoesListResponse,
} from "@/lib/types/simulador-api";

export type ClientErrorCode =
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
  | "RATE_LIMITED"
  | "NOT_FOUND"
  | "INTERNAL_ERROR"
  | "NETWORK_ERROR"
  | "UNKNOWN";

interface ApiFailureBody {
  ok?: false;
  code?: ClientErrorCode;
  message?: string;
}

export class ApiClientError extends Error {
  readonly code: ClientErrorCode;
  readonly status: number;

  constructor(message: string, code: ClientErrorCode, status: number) {
    super(message);
    this.name = "ApiClientError";
    this.code = code;
    this.status = status;
  }
}

async function parseJsonBody<T>(response: Response): Promise<T> {
  try {
    return (await response.json()) as T;
  } catch {
    throw new ApiClientError(
      "Resposta inválida do servidor.",
      "UNKNOWN",
      response.status
    );
  }
}

function buildRequestAuthHeaders(username?: string): HeadersInit {
  const session = getSession();
  const headers: Record<string, string> = {};

  if (session?.mode === "cloud" && session.accessToken?.trim()) {
    headers.Authorization = `Bearer ${session.accessToken.trim()}`;
  }

  const activeUser = username?.trim() || session?.username?.trim();
  if (activeUser) {
    headers["X-Planner-Sigaa-User"] = activeUser;
  }

  return headers;
}

async function requestJson<T>(
  path: string,
  init?: RequestInit,
  sigaaUsername?: string
): Promise<T> {
  let response: Response;

  // Timeout evita loading infinito no browser (Workers/rede).
  const timeoutMs =
    path.startsWith("/api/sync") && !path.includes("/queue/")
      ? 0
      : path.startsWith("/api/")
        ? 20_000
        : 0;
  const controller =
    !init?.signal && timeoutMs > 0 ? new AbortController() : null;
  const timer = controller
    ? setTimeout(() => controller.abort(), timeoutMs)
    : null;

  try {
    response = await fetch(path, {
      ...init,
      signal: init?.signal ?? controller?.signal,
      headers: {
        "Content-Type": "application/json",
        ...buildRequestAuthHeaders(sigaaUsername),
        ...init?.headers,
      },
    });
  } catch {
    throw new ApiClientError(
      "Não foi possível conectar ao servidor. Verifique se o app está rodando.",
      "NETWORK_ERROR",
      0
    );
  } finally {
    if (timer) clearTimeout(timer);
  }

  const body = await parseJsonBody<T & ApiFailureBody>(response);

  if (!response.ok) {
    throw new ApiClientError(
      body.message ?? "Falha na requisição.",
      body.code ?? "INTERNAL_ERROR",
      response.status
    );
  }

  return body;
}

export interface SubmitTarefaResponse {
  submissionId: string;
  status: string;
  message: string;
}

/** Multipart — não envia Content-Type (boundary automático). */
export async function submitTarefaToSigaa(
  id: number,
  form: FormData
): Promise<SubmitTarefaResponse> {
  let response: Response;
  try {
    response = await fetch(`/api/tarefas/${id}/submit`, {
      method: "POST",
      body: form,
      headers: {
        ...buildRequestAuthHeaders(),
      },
    });
  } catch {
    throw new ApiClientError(
      "Não foi possível conectar ao servidor.",
      "NETWORK_ERROR",
      0
    );
  }

  const body = await parseJsonBody<SubmitTarefaResponse & ApiFailureBody>(response);
  if (!response.ok) {
    throw new ApiClientError(
      body.message ?? "Falha no envio.",
      body.code ?? "INTERNAL_ERROR",
      response.status
    );
  }
  return body;
}

export async function getAuthConfig(
  init?: RequestInit
): Promise<AuthConfigResponse> {
  return requestJson<AuthConfigResponse>("/api/auth/config", init);
}

export async function postAuthRegister(
  body: RegisterAccountBody
): Promise<AccountAuthResponse> {
  return requestJson<AccountAuthResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function postAuthLogin(
  body: LoginAccountBody
): Promise<AccountAuthResponse> {
  return requestJson<AccountAuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function getSyncReadiness(
  username: string
): Promise<SyncReadinessResponse> {
  const params = new URLSearchParams({ username: username.trim() });
  return requestJson<SyncReadinessResponse>(
    `/api/sync/readiness?${params.toString()}`
  );
}

export async function postSigaaVerify(
  credentials: Pick<SyncRequest, "username" | "password" | "savePassword">
): Promise<{ ok: true }> {
  return requestJson<{ ok: true }>(
    "/api/auth/verify-sigaa",
    {
      method: "POST",
      body: JSON.stringify(credentials),
    },
    credentials.username
  );
}

export async function postSync(
  credentials: SyncRequest,
  mode: SyncMode = credentials.mode ?? "full"
): Promise<SyncSuccessResponse> {
  return requestJson<SyncSuccessResponse>(
    "/api/sync",
    {
      method: "POST",
      body: JSON.stringify({ ...credentials, mode }),
    },
    credentials.username
  );
}

export async function postSyncQueue(
  body: EnqueueSyncQueueBody
): Promise<EnqueueSyncQueueResponse> {
  return requestJson<EnqueueSyncQueueResponse>(
    "/api/sync/queue",
    {
      method: "POST",
      body: JSON.stringify(body),
    },
    body.username
  );
}

export async function getSyncQueueJob(
  jobId: string,
  sigaaUsername?: string
): Promise<SyncQueueJobView> {
  const response = await requestJson<GetSyncQueueJobResponse>(
    `/api/sync/queue/${encodeURIComponent(jobId)}`,
    undefined,
    sigaaUsername ?? getSession()?.username
  );
  return response.job;
}

export interface CalendarioSyncResponse {
  ok: boolean;
  skipped?: boolean;
  partial?: boolean;
  rowsWritten: number;
  message: string;
}

export async function postCalendarioSync(
  credentials: SyncRequest,
  options?: { force?: boolean }
): Promise<CalendarioSyncResponse> {
  return requestJson<CalendarioSyncResponse>(
    "/api/sync/calendario",
    {
      method: "POST",
      body: JSON.stringify({ ...credentials, force: options?.force === true }),
    },
    credentials.username
  );
}

export async function postTurmasOfertadasSync(
  credentials: SyncRequest,
  options?: { force?: boolean }
): Promise<TurmasOfertadasSyncResponse> {
  return requestJson<TurmasOfertadasSyncResponse>(
    "/api/sync/turmas",
    {
      method: "POST",
      body: JSON.stringify({ ...credentials, force: options?.force === true }),
    },
    credentials.username
  );
}

export interface TurmasSelecionadasSyncResponse {
  ok: boolean;
  turmas: import("@/lib/scraper/turmas-selecionadas/parse-turmas-selecionadas").TurmaSelecionadaItem[];
}

export async function postTurmasSelecionadasSync(
  credentials: SyncRequest
): Promise<TurmasSelecionadasSyncResponse> {
  return requestJson<TurmasSelecionadasSyncResponse>(
    "/api/sync/turmas-selecionadas",
    {
      method: "POST",
      body: JSON.stringify(credentials),
    },
    credentials.username
  );
}

export async function getTurmasOfertadas(): Promise<TurmasOfertadasResponse> {
  return requestJson<TurmasOfertadasResponse>("/api/turmas-ofertadas");
}

export async function postSimuladorChoques(
  body: SimuladorChoquesRequestBody
): Promise<SimuladorChoquesResponse> {
  return requestJson<SimuladorChoquesResponse>("/api/simulador/choques", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function getSimuladorSimulacoes(): Promise<SimuladorSimulacoesListResponse> {
  return requestJson<SimuladorSimulacoesListResponse>(
    "/api/simulador/simulacoes"
  );
}

export async function getSimuladorSimulacao(
  id: string
): Promise<{ ok: true; simulation: SimuladorSimulationDetail }> {
  return requestJson<{ ok: true; simulation: SimuladorSimulationDetail }>(
    `/api/simulador/simulacoes/${encodeURIComponent(id)}`
  );
}

export async function postSimuladorSimulacao(
  body: SimuladorSaveSimulationRequestBody
): Promise<SimuladorSaveSimulationResponse> {
  return requestJson<SimuladorSaveSimulationResponse>(
    "/api/simulador/simulacoes",
    {
      method: "POST",
      body: JSON.stringify(body),
    }
  );
}

export async function deleteSimuladorSimulacao(
  id: string
): Promise<{ ok: true; deleted: true }> {
  return requestJson<{ ok: true; deleted: true }>(
    `/api/simulador/simulacoes/${encodeURIComponent(id)}`,
    { method: "DELETE" }
  );
}

export async function getDashboard(): Promise<DashboardResponse> {
  return requestJson<DashboardResponse>("/api/dashboard");
}

export async function getPerfil(): Promise<PerfilResponse> {
  return requestJson<PerfilResponse>("/api/perfil");
}

export async function patchPerfil(body: PatchPerfilBody): Promise<PerfilResponse> {
  return requestJson<PerfilResponse>("/api/perfil", {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

function buildDisciplinaListQuery(
  q?: string,
  filter?: DisciplinaListFilter
): string {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (filter && filter !== "todas") params.set("filter", filter);
  const query = params.toString();
  return query ? `?${query}` : "";
}

export async function getDisciplinas(
  q?: string,
  filter?: DisciplinaListFilter
): Promise<DisciplinaListResponse> {
  return requestJson<DisciplinaListResponse>(
    `/api/disciplinas${buildDisciplinaListQuery(q, filter)}`
  );
}

export async function getDisciplina(
  code: string
): Promise<SubjectDetailResponse> {
  return requestJson<SubjectDetailResponse>(
    `/api/disciplinas/${encodeURIComponent(code)}`
  );
}

export async function patchDisciplinaNotas(
  code: string,
  body: PatchNotasBody
): Promise<PatchNotasResponse> {
  return requestJson<PatchNotasResponse>(
    `/api/disciplinas/${encodeURIComponent(code)}/notas`,
    {
      method: "PATCH",
      body: JSON.stringify(body),
    }
  );
}

export async function patchDisciplinaFalta(
  code: string,
  body: PatchFaltaBody
): Promise<PatchFaltaResponse> {
  return requestJson<PatchFaltaResponse>(
    `/api/disciplinas/${encodeURIComponent(code)}/faltas`,
    {
      method: "PATCH",
      body: JSON.stringify(body),
    }
  );
}

export async function patchDisciplinaAppearance(
  code: string,
  body: PatchDisciplinaAppearanceBody
): Promise<PatchDisciplinaAppearanceResponse> {
  return requestJson<PatchDisciplinaAppearanceResponse>(
    `/api/disciplinas/${encodeURIComponent(code)}/appearance`,
    {
      method: "PATCH",
      body: JSON.stringify(body),
    }
  );
}

export async function patchTarefa(
  id: number,
  body: PatchTarefaBody
): Promise<{ id: number }> {
  return requestJson<{ id: number }>(`/api/tarefas/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function createDisciplinaTarefa(
  code: string,
  body: CreateTarefaBody
): Promise<AcademicTask> {
  return requestJson<AcademicTask>(
    `/api/disciplinas/${encodeURIComponent(code)}/tarefas`,
    {
      method: "POST",
      body: JSON.stringify(body),
    }
  );
}

export async function getCalendar(): Promise<CalendarResponse> {
  return requestJson<CalendarResponse>("/api/calendar");
}

export async function createCalendarEvent(
  body: CreateCalendarEventBody
): Promise<CalendarEvent> {
  return requestJson<CalendarEvent>("/api/calendar/events", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function patchCalendarEvent(
  id: string,
  body: PatchCalendarEventBody
): Promise<PatchCalendarEventResponse> {
  return requestJson<PatchCalendarEventResponse>(
    `/api/calendar/events/${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      body: JSON.stringify(body),
    }
  );
}

export async function getIntegralizacao(): Promise<IntegralizacaoResponse> {
  return requestJson<IntegralizacaoResponse>("/api/integralizacao");
}

export async function postIntegralizacaoHours(
  body: PostIntegralizacaoBody
): Promise<IntegralizacaoResponse> {
  return requestJson<IntegralizacaoResponse>("/api/integralizacao", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function getMapa(): Promise<MapaResponse> {
  return requestJson<MapaResponse>("/api/mapa");
}

/** B35 — nós + arestas (pre solid / co dashed) para o grafo react-flow (F20). */
export async function getMapaGrafo(): Promise<MapaGrafoResponse> {
  return requestJson<MapaGrafoResponse>("/api/mapa/grafo");
}

export async function getSchedule(): Promise<ScheduleApiResponse> {
  return requestJson<ScheduleApiResponse>("/api/schedule");
}

export async function getNotifications(): Promise<NotificationsSnapshotResponse> {
  return requestJson<NotificationsSnapshotResponse>("/api/notifications");
}

export async function getBillingPlans(): Promise<BillingPlansResponse> {
  return requestJson<BillingPlansResponse>("/api/billing/plans");
}

export async function postBillingCheckout(
  body: BillingCheckoutRequestBody
): Promise<BillingCheckoutResponse> {
  const idempotencyKey =
    body.idempotencyKey?.trim() || crypto.randomUUID().replace(/-/g, "");

  return requestJson<BillingCheckoutResponse>("/api/billing/checkout", {
    method: "POST",
    headers: {
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify({
      planId: body.planId,
      idempotencyKey,
    }),
  });
}

export async function getBillingPaymentStatus(
  paymentId: string
): Promise<BillingPaymentStatusResponse> {
  return requestJson<BillingPaymentStatusResponse>(
    `/api/billing/payments/${encodeURIComponent(paymentId)}`
  );
}

export async function getBillingAccount(): Promise<BillingAccountResponse> {
  return requestJson<BillingAccountResponse>("/api/billing/account");
}

export async function postBillingRedeemKey(
  body: RedeemGiftKeyRequestBody
): Promise<RedeemGiftKeyResponse> {
  return requestJson<RedeemGiftKeyResponse>("/api/billing/redeem-key", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export const SYNC_COMPLETE_EVENT = "planner:sync-complete";

export function notifySyncComplete(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(SYNC_COMPLETE_EVENT));
}
