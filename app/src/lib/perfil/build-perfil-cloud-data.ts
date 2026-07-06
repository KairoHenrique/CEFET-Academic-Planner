import { pgGetAluno } from "@/lib/db/postgres/queries-read";
import { DEFAULT_NOTIFICATION_PREFERENCES } from "@/lib/notifications/notification-preferences-shared";
import { getSyncAutoIntervalMinutes } from "@/lib/sync/sync-preferences";

export async function resolveCloudPerfilAluno() {
  return pgGetAluno();
}

export function resolveCloudNotificationPreferences() {
  return { ...DEFAULT_NOTIFICATION_PREFERENCES };
}

export function resolveCloudSyncLastAt(): string | null {
  return null;
}

export function resolveCloudSyncIntervalMinutes(): number {
  return getSyncAutoIntervalMinutes();
}
