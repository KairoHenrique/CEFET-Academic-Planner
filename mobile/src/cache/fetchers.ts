import type {
  CalendarApiResponse,
  DashboardResponse,
  DisciplinaListResponse,
  IntegralizacaoResponse,
  MapaResponse,
  NotificationsSnapshotResponse,
  ScheduleApiResponse,
} from "@acme/api-contracts";
import { requestJson } from "../auth/api";
import { getSession } from "../auth/session";
import {
  readAcademicCache,
  writeAcademicCache,
  type AcademicCacheKey,
  type AcademicSnapshot,
} from "./academic-cache";

type CacheField = AcademicCacheKey;

export type FetchOptions = {
  /** Ignora cache e busca so na rede (revalidate apos paint). */
  forceNetwork?: boolean;
};

/**
 * Stale-while-revalidate:
 * - Com cache e !forceNetwork → devolve cache na hora.
 * - Sem cache ou forceNetwork → espera a rede e grava cache.
 */
async function withCacheFirst<T>(
  field: CacheField,
  fetcher: () => Promise<T>,
  options?: FetchOptions
): Promise<{ data: T; fromCache: boolean }> {
  const session = getSession();
  const forceNetwork = Boolean(options?.forceNetwork);

  if (!forceNetwork && session?.userId) {
    const cached = await readAcademicCache(session.userId);
    const value = cached?.[field];
    if (value !== undefined) {
      return { data: value as T, fromCache: true };
    }
  }

  try {
    const data = await fetcher();
    if (session?.userId) {
      await writeAcademicCache(session.userId, {
        [field]: data,
      } as Partial<AcademicSnapshot>);
    }
    return { data, fromCache: false };
  } catch (error) {
    if (!forceNetwork && session?.userId) {
      const cached = await readAcademicCache(session.userId);
      const fallback = cached?.[field];
      if (fallback !== undefined) {
        return { data: fallback as T, fromCache: true };
      }
    }
    throw error;
  }
}

export async function fetchDashboard(
  options?: FetchOptions
): Promise<{ data: DashboardResponse; fromCache: boolean }> {
  return withCacheFirst(
    "dashboard",
    () => requestJson<DashboardResponse>("/api/dashboard"),
    options
  );
}

export async function fetchDisciplinas(
  options?: FetchOptions
): Promise<{ data: DisciplinaListResponse; fromCache: boolean }> {
  return withCacheFirst(
    "disciplinas",
    () => requestJson<DisciplinaListResponse>("/api/disciplinas"),
    options
  );
}

export async function fetchCalendar(
  options?: FetchOptions
): Promise<{ data: CalendarApiResponse; fromCache: boolean }> {
  return withCacheFirst(
    "calendar",
    () => requestJson<CalendarApiResponse>("/api/calendar"),
    options
  );
}

export async function fetchSchedule(
  options?: FetchOptions
): Promise<{ data: ScheduleApiResponse; fromCache: boolean }> {
  return withCacheFirst(
    "schedule",
    () => requestJson<ScheduleApiResponse>("/api/schedule"),
    options
  );
}

export async function fetchMapa(
  options?: FetchOptions
): Promise<{ data: MapaResponse; fromCache: boolean }> {
  return withCacheFirst(
    "mapa",
    () => requestJson<MapaResponse>("/api/mapa"),
    options
  );
}

export async function fetchIntegralizacao(
  options?: FetchOptions
): Promise<{ data: IntegralizacaoResponse; fromCache: boolean }> {
  return withCacheFirst(
    "integralizacao",
    () => requestJson<IntegralizacaoResponse>("/api/integralizacao"),
    options
  );
}

export async function fetchNotifications(
  options?: FetchOptions
): Promise<{ data: NotificationsSnapshotResponse; fromCache: boolean }> {
  return withCacheFirst(
    "notifications",
    () =>
      requestJson<NotificationsSnapshotResponse>("/api/notifications"),
    options
  );
}

export async function peekAcademicCache(): Promise<AcademicSnapshot | null> {
  const session = getSession();
  if (!session?.userId) return null;
  return readAcademicCache(session.userId);
}
