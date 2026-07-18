import type {
  CalendarApiResponse,
  DashboardResponse,
  DisciplinaListResponse,
  IntegralizacaoResponse,
  MapaResponse,
  NotificationsSnapshotResponse,
} from "@acme/api-contracts";
import { requestJson } from "../auth/api";
import { getSession } from "../auth/session";
import {
  readAcademicCache,
  writeAcademicCache,
  type AcademicSnapshot,
} from "./academic-cache";

async function withCacheWrite<T>(
  field: keyof Omit<AcademicSnapshot, "updatedAt">,
  fetcher: () => Promise<T>
): Promise<{ data: T; fromCache: boolean }> {
  const session = getSession();
  try {
    const data = await fetcher();
    if (session?.userId) {
      await writeAcademicCache(session.userId, {
        [field]: data,
      } as Partial<AcademicSnapshot>);
    }
    return { data, fromCache: false };
  } catch (error) {
    if (!session?.userId) throw error;
    const cached = await readAcademicCache(session.userId);
    const fallback = cached?.[field];
    if (fallback !== undefined) {
      return { data: fallback as T, fromCache: true };
    }
    throw error;
  }
}

export async function fetchDashboard(): Promise<{
  data: DashboardResponse;
  fromCache: boolean;
}> {
  return withCacheWrite("dashboard", () =>
    requestJson<DashboardResponse>("/api/dashboard")
  );
}

export async function fetchDisciplinas(): Promise<{
  data: DisciplinaListResponse;
  fromCache: boolean;
}> {
  return withCacheWrite("disciplinas", () =>
    requestJson<DisciplinaListResponse>("/api/disciplinas")
  );
}

export async function fetchCalendar(): Promise<{
  data: CalendarApiResponse;
  fromCache: boolean;
}> {
  return withCacheWrite("calendar", () =>
    requestJson<CalendarApiResponse>("/api/calendar")
  );
}

export async function fetchMapa(): Promise<{
  data: MapaResponse;
  fromCache: boolean;
}> {
  return withCacheWrite("mapa", () => requestJson<MapaResponse>("/api/mapa"));
}

export async function fetchIntegralizacao(): Promise<{
  data: IntegralizacaoResponse;
  fromCache: boolean;
}> {
  return withCacheWrite("integralizacao", () =>
    requestJson<IntegralizacaoResponse>("/api/integralizacao")
  );
}

export async function fetchNotifications(): Promise<{
  data: NotificationsSnapshotResponse;
  fromCache: boolean;
}> {
  return withCacheWrite("notifications", () =>
    requestJson<NotificationsSnapshotResponse>("/api/notifications")
  );
}

/** Lê snapshot sem rede (telas offline / boot). */
export async function peekAcademicCache(): Promise<AcademicSnapshot | null> {
  const session = getSession();
  if (!session?.userId) return null;
  return readAcademicCache(session.userId);
}
