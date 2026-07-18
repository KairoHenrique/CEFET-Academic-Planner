import type {
  AttendanceSummary,
  CalendarEvent,
  IntegralizacaoResponse,
  SubjectDetailResponse,
} from "@acme/api-contracts";
import { requestJson } from "../auth/api";

export async function toggleTarefa(
  id: number,
  concluida: boolean
): Promise<unknown> {
  return requestJson(`/api/tarefas/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ action: "toggle", concluida }),
  });
}

export async function deleteTarefa(id: number): Promise<unknown> {
  return requestJson(`/api/tarefas/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ action: "delete" }),
  });
}

export async function createTarefa(
  code: string,
  body: {
    titulo: string;
    data_fim: string;
    hora_fim?: string;
    tipo?: "individual" | "grupo";
    descricao?: string;
  }
): Promise<unknown> {
  return requestJson(`/api/disciplinas/${encodeURIComponent(code)}/tarefas`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function updateNotaScore(
  code: string,
  id: number,
  nota_obtida: number | null
): Promise<{ evaluations: unknown; grade: number | null }> {
  return requestJson(`/api/disciplinas/${encodeURIComponent(code)}/notas`, {
    method: "PATCH",
    body: JSON.stringify({ action: "update", id, nota_obtida }),
  });
}

export async function addNota(
  code: string,
  body: {
    avaliacao_nome: string;
    nota_maxima: number;
    nota_obtida?: number | null;
    nota_extra?: boolean;
  }
): Promise<{ evaluations: unknown; grade: number | null }> {
  return requestJson(`/api/disciplinas/${encodeURIComponent(code)}/notas`, {
    method: "PATCH",
    body: JSON.stringify({ action: "add", ...body }),
  });
}

export async function updateFaltaStatus(
  code: string,
  id: number,
  status: "presente" | "falta" | "nao_registrada"
): Promise<{ attendance: AttendanceSummary; subject?: SubjectDetailResponse["subject"] }> {
  return requestJson(`/api/disciplinas/${encodeURIComponent(code)}/faltas`, {
    method: "PATCH",
    body: JSON.stringify({ action: "update", id, status }),
  });
}

export async function createCalendarEvent(body: {
  title: string;
  date: string;
  type: string;
  timeStart?: string | null;
  timeEnd?: string | null;
  description?: string;
  subjectCode?: string | null;
}): Promise<CalendarEvent> {
  return requestJson("/api/calendar/events", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function toggleCalendarEvent(
  id: string,
  done: boolean
): Promise<CalendarEvent> {
  return requestJson(`/api/calendar/events/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({ action: "toggle", done }),
  });
}

export async function deleteCalendarEvent(id: string): Promise<unknown> {
  return requestJson(`/api/calendar/events/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({ action: "delete" }),
  });
}

export async function postIntegralizacaoHours(body: {
  tipoCh: string;
  horas: number;
}): Promise<IntegralizacaoResponse> {
  return requestJson("/api/integralizacao", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function enqueueSync(body: {
  username: string;
  password?: string;
  mode?: "lite" | "full";
  trigger?: "manual" | "auto" | "first_login";
}): Promise<{ ok: true; reused: boolean; job: { id: string; status: string } }> {
  return requestJson("/api/sync/queue", {
    method: "POST",
    body: JSON.stringify({
      username: body.username,
      password: body.password,
      mode: body.mode ?? "lite",
      trigger: body.trigger ?? "manual",
      lane: "normal",
    }),
  });
}

export async function fetchMapaGrafo(): Promise<{
  curso: string;
  historicoSynced: boolean;
  statusLabels: Record<string, string>;
  nodes: Array<{
    id: string;
    data: {
      code: string;
      name: string;
      shortLabel: string;
      status: string;
      period: number;
      ch: number;
    };
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    kind: "pre" | "co";
    strokeStyle: "solid" | "dashed";
  }>;
}> {
  return requestJson("/api/mapa/grafo");
}

export async function checkChoques(turmaSigaaIds: string[]): Promise<{
  ok: true;
  hasConflicts: boolean;
  conflicts: Array<{
    turmaSigaaIdA: string;
    turmaSigaaIdB: string;
  }>;
  invalidTurmaIds: string[];
}> {
  return requestJson("/api/simulador/choques", {
    method: "POST",
    body: JSON.stringify({ turmaSigaaIds }),
  });
}

export async function listSimulacoes(): Promise<{
  ok: true;
  items: Array<{ id: number; titulo: string; semestre: string }>;
}> {
  return requestJson("/api/simulador/simulacoes");
}

export async function saveSimulacao(body: {
  titulo: string;
  turmaSigaaIds: string[];
  semestre?: string;
}): Promise<unknown> {
  return requestJson("/api/simulador/simulacoes", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function deleteSimulacao(id: number): Promise<unknown> {
  return requestJson(`/api/simulador/simulacoes/${id}`, {
    method: "DELETE",
  });
}

export async function patchAppearance(
  code: string,
  body: Record<string, unknown>
): Promise<unknown> {
  return requestJson(
    `/api/disciplinas/${encodeURIComponent(code)}/appearance`,
    {
      method: "PATCH",
      body: JSON.stringify(body),
    }
  );
}
