import { pgGetAluno } from "@/lib/db/postgres/queries-read";
import { pgGetNotificationPreferences } from "@/lib/notifications/notification-preferences-store";
import { getSyncAutoIntervalMinutes } from "@/lib/sync/sync-preferences";
import type { NotificationPreferences } from "@/lib/types/perfil-api";

export async function resolveCloudPerfilAluno() {
  return pgGetAluno();
}

export async function resolveCloudNotificationPreferences(
  userId: string
): Promise<NotificationPreferences> {
  return pgGetNotificationPreferences(userId);
}

export function resolveCloudSyncLastAt(): string | null {
  return null;
}

export function resolveCloudSyncIntervalMinutes(): number {
  return getSyncAutoIntervalMinutes();
}
