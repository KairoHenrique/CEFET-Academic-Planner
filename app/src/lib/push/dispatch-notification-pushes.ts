import { findProfileByCpf } from "@/lib/auth/account/profile-repository";
import { normalizeCpf } from "@/lib/auth/account/cpf";
import { isPostgresBackend } from "@/lib/db/backend/config";
import { getPostgresPool } from "@/lib/db/postgres/pool";
import { runWithTenantUserId } from "@/lib/db/postgres/tenant-context";
import { buildActiveNotificationItems } from "@/lib/notifications/build-active-notification-items";
import { buildNotificationSnapshotCloud } from "@/lib/notifications/build-notification-snapshot-cloud";
import { pgGetNotificationPreferences } from "@/lib/notifications/notification-preferences-store";
import { notifyCpfDevices } from "@/lib/push/expo-push-send";
import { pushNewNotificationItems } from "@/lib/push/push-new-notification-items";
import {
  pgGetPushSentFingerprints,
  pgMarkPushFingerprintsSent,
} from "@/lib/push/push-sent-fingerprints-store";
import { listPushTokensByCpf } from "@/lib/push/push-token-repository";
import {
  getMirrorPool,
  isSyncMirrorEnabled,
} from "@/lib/sync-mirror/mirror-config";
import type { NotificationPreferences } from "@/lib/types/perfil-api";
import type pg from "pg";

function resolvePushDataPool(): pg.Pool {
  if (isPostgresBackend()) {
    return getPostgresPool();
  }
  if (isSyncMirrorEnabled()) {
    return getMirrorPool();
  }
  throw new Error("Sem pool Postgres para push de notificações.");
}

function anyAcademicPrefOn(prefs: NotificationPreferences): boolean {
  return (
    prefs.tasks ||
    prefs.grades ||
    prefs.taskReminders ||
    prefs.calendarReminders ||
    prefs.classReminders ||
    prefs.integralizacaoAlerts ||
    prefs.academicDateAlerts
  );
}

export async function resolveCloudNotificationPrefsForCpf(
  cpf: string
): Promise<{ userId: string; preferences: NotificationPreferences } | null> {
  const profile = await findProfileByCpf(cpf);
  if (!profile) return null;
  const preferences = await pgGetNotificationPreferences(profile.userId);
  return { userId: profile.userId, preferences };
}

/**
 * Avalia sino + lembretes ativos do aluno e dispara Expo push só do que
 * ele pediu nas prefs e ainda não foi enviado.
 */
export async function dispatchNotificationPushesForUser(input: {
  userId: string;
  cpf: string;
}): Promise<{ sent: number; skipped: boolean; reason?: string }> {
  const preferences = await pgGetNotificationPreferences(input.userId);
  if (!anyAcademicPrefOn(preferences)) {
    return {
      sent: 0,
      skipped: true,
      reason: "prefs_off",
    };
  }

  const pool = resolvePushDataPool();
  const tokens = await listPushTokensByCpf(pool, input.cpf);
  if (tokens.length === 0) {
    return { sent: 0, skipped: true, reason: "no_tokens" };
  }

  let snapshot;
  try {
    snapshot = await runWithTenantUserId(input.userId, () =>
      buildNotificationSnapshotCloud()
    );
  } catch {
    return { sent: 0, skipped: true, reason: "snapshot_unavailable" };
  }

  const items = buildActiveNotificationItems({
    items: snapshot.items,
    pendingTasks: snapshot.pendingTasks,
    pendingCalendarEvents: snapshot.pendingCalendarEvents,
    pendingClassSessions: snapshot.pendingClassSessions,
    preferences: snapshot.preferences,
  });

  const alreadySent = await pgGetPushSentFingerprints(input.userId);

  // Primeira execução do usuário: só baselina fingerprints (sem push em massa).
  if (alreadySent.size === 0 && items.length > 0) {
    await pgMarkPushFingerprintsSent(
      input.userId,
      items.map((item) => item.fingerprint)
    );

    return { sent: 0, skipped: true, reason: "bootstrap" };
  }

  const sent = await pushNewNotificationItems({
    userId: input.userId,
    tokens,
    items,
    alreadySent,
  });

  return { sent, skipped: sent === 0 };
}

export async function dispatchNotificationPushesForCpf(
  username: string,
  _options?: { fallbackSyncToast?: boolean }
): Promise<void> {
  const cpf = normalizeCpf(username);
  if (cpf.length !== 11) return;

  const resolved = await resolveCloudNotificationPrefsForCpf(cpf);
  if (!resolved) return;

  await dispatchNotificationPushesForUser({
    userId: resolved.userId,
    cpf,
  });
}
