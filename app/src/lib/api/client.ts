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
import type { NotificationsSnapshotResponse } from "@/lib/types/notifications-api";
import type { PerfilResponse, PatchPerfilBody } from "@/lib/types/perfil-api";
import type { ScheduleApiResponse } from "@/lib/types/schedule-api";

export type ClientErrorCode =
  | "VALIDATION_ERROR"
  | "INVALID_CREDENTIALS"
  | "SIGAA_OFFLINE"
  | "SIGAA_TIMEOUT"
  | "SIGAA_AUTH_FAILED"
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

function buildSigaaUserHeaders(username?: string): HeadersInit {
  const activeUser = username?.trim() || getSession()?.username?.trim();
  if (!activeUser) return {};
  return { "X-Planner-Sigaa-User": activeUser };
}

async function requestJson<T>(
  path: string,
  init?: RequestInit,
  sigaaUsername?: string
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(path, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...buildSigaaUserHeaders(sigaaUsername),
        ...init?.headers,
      },
    });
  } catch {
    throw new ApiClientError(
      "Não foi possível conectar ao servidor. Verifique se o app está rodando.",
      "NETWORK_ERROR",
      0
    );
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

export async function getSchedule(): Promise<ScheduleApiResponse> {
  return requestJson<ScheduleApiResponse>("/api/schedule");
}

export async function getNotifications(): Promise<NotificationsSnapshotResponse> {
  return requestJson<NotificationsSnapshotResponse>("/api/notifications");
}

export const SYNC_COMPLETE_EVENT = "planner:sync-complete";

export function notifySyncComplete(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(SYNC_COMPLETE_EVENT));
}
