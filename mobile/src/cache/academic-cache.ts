import AsyncStorage from "@react-native-async-storage/async-storage";
import type {
  CalendarApiResponse,
  DashboardResponse,
  DisciplinaListResponse,
  IntegralizacaoResponse,
  MapaResponse,
  NotificationsSnapshotResponse,
  ScheduleApiResponse,
} from "@acme/api-contracts";

const ROOT_PREFIX = "acme-hub.cache.v1";

/** Snapshot acadêmico local (M5) — atualizado após fetches da API. */
export interface AcademicSnapshot {
  updatedAt: string;
  dashboard?: DashboardResponse;
  disciplinas?: DisciplinaListResponse;
  calendar?: CalendarApiResponse;
  schedule?: ScheduleApiResponse;
  mapa?: MapaResponse;
  integralizacao?: IntegralizacaoResponse;
  notifications?: NotificationsSnapshotResponse;
}

export type AcademicCacheKey = keyof Omit<AcademicSnapshot, "updatedAt">;

function storageKey(userId: string): string {
  return `${ROOT_PREFIX}:${userId}`;
}

export async function readAcademicCache(
  userId: string
): Promise<AcademicSnapshot | null> {
  try {
    const raw = await AsyncStorage.getItem(storageKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AcademicSnapshot;
    if (!parsed?.updatedAt) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function writeAcademicCache(
  userId: string,
  patch: Partial<Omit<AcademicSnapshot, "updatedAt">>
): Promise<AcademicSnapshot> {
  const prev = (await readAcademicCache(userId)) ?? { updatedAt: "" };
  const next: AcademicSnapshot = {
    ...prev,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  await AsyncStorage.setItem(storageKey(userId), JSON.stringify(next));
  return next;
}

export async function clearAcademicCache(userId: string): Promise<void> {
  await AsyncStorage.removeItem(storageKey(userId));
}

/** Remove todos os snapshots (logout / troca de conta). */
export async function clearAllAcademicCaches(): Promise<void> {
  const keys = await AsyncStorage.getAllKeys();
  const ours = keys.filter((key) => key.startsWith(`${ROOT_PREFIX}:`));
  if (ours.length > 0) {
    await AsyncStorage.multiRemove(ours);
  }
}

export function cacheAgeLabel(updatedAt: string | undefined): string | null {
  if (!updatedAt) return null;
  const ms = Date.now() - new Date(updatedAt).getTime();
  if (!Number.isFinite(ms) || ms < 0) return null;
  const min = Math.floor(ms / 60_000);
  if (min < 1) return "cache agora";
  if (min < 60) return `cache há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `cache há ${h}h`;
  return `cache há ${Math.floor(h / 24)}d`;
}
