import { findProfileByCpf } from "@/lib/auth/account/profile-repository";
import { normalizeCpf } from "@/lib/auth/account/cpf";
import { isPostgresBackend } from "@/lib/db/backend/config";
import { getPostgresPool } from "@/lib/db/postgres/pool";
import { runWithTenantUserId } from "@/lib/db/postgres/tenant-context";
import { buildActiveNotificationItems } from "@/lib/notifications/build-active-notification-items";
import { buildNotificationSnapshotCloud } from "@/lib/notifications/build-notification-snapshot-cloud";
import { taskIdentityKeyFromFingerprint } from "@/lib/notifications/notification-fingerprint";
import { pgGetNotificationPreferences } from "@/lib/notifications/notification-preferences-store";
import { pushNewNotificationItems } from "@/lib/push/push-new-notification-items";
import {
  pgGetPushSentFingerprints,
  pgGetSentTaskIdentities,
  pgMarkPushFingerprintsSent,
  pgMarkTaskIdentitiesSeen,
} from "@/lib/push/push-sent-fingerprints-store";
import { listPushTokensByCpf } from "@/lib/push/push-token-repository";
import {
  getMirrorPool,
  isSyncMirrorEnabled,
} from "@/lib/sync-mirror/mirror-config";
import type { NotificationPreferences } from "@/lib/types/perfil-api";
import type { NotificationSnapshotItem } from "@/lib/types/notifications-api";
import type pg from "pg";

/** Kinds vindos do scrape — não devem virar push a cada sync. */
const SYNC_NO_PUSH_KINDS = new Set([
  "task",
  "grade",
  "calendar-date-alert",
  "integralizacao-alert",
]);

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

function collectTaskIdentities(items: NotificationSnapshotItem[]): string[] {
  const identities: string[] = [];
  for (const item of items) {
    if (item.kind !== "task") continue;
    const identity = taskIdentityKeyFromFingerprint(item.fingerprint);
    if (identity) identities.push(identity);
  }
  return identities;
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
 *
 * `source: "sync"` — pós-sync: NÃO envia "Nova Tarefa"/"Nova Nota" (só lembretes).
 * `source: "cron"` — lembretes de prazo/aula + discovery só se identidade nova.
 */
export async function dispatchNotificationPushesForUser(input: {
  userId: string;
  cpf: string;
  source?: "sync" | "cron";
}): Promise<{ sent: number; skipped: boolean; reason?: string }> {
  const source = input.source ?? "cron";
  console.info(
    `[push] Avaliando pushes (${source}) para user=${input.userId.slice(0, 8)}...`
  );
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

  const alreadySent = await pgGetPushSentFingerprints(input.userId);
  const seenTaskIdentities = await pgGetSentTaskIdentities(input.userId);

  let snapshot;
  try {
    snapshot = await runWithTenantUserId(input.userId, () =>
      buildNotificationSnapshotCloud()
    );
  } catch (err) {
    console.warn(`[push] Snapshot indisponível:`, err);
    return { sent: 0, skipped: true, reason: "snapshot_unavailable" };
  }

  const items = buildActiveNotificationItems({
    items: snapshot.items,
    pendingTasks: snapshot.pendingTasks,
    pendingCalendarEvents: snapshot.pendingCalendarEvents,
    pendingClassSessions: snapshot.pendingClassSessions,
    preferences: snapshot.preferences,
  });

  // Primeira execução: baselina tudo, zero push.
  if (alreadySent.size === 0 && seenTaskIdentities.size === 0 && items.length > 0) {
    await pgMarkPushFingerprintsSent(
      input.userId,
      items.map((item) => item.fingerprint)
    );
    await pgMarkTaskIdentitiesSeen(
      input.userId,
      collectTaskIdentities(items)
    );
    console.info(
      `[push] Bootstrap: ${items.length} itens marcados sem push.`
    );
    return { sent: 0, skipped: true, reason: "bootstrap" };
  }

  // Pós-sync: NUNCA push de tarefa/nota/alertas de scrape — só lembretes.
  // Isso elimina o spam "Nova Tarefa" a cada sync.
  const baselineKinds = items.filter((item) => SYNC_NO_PUSH_KINDS.has(item.kind));
  if (baselineKinds.length > 0) {
    await pgMarkPushFingerprintsSent(
      input.userId,
      baselineKinds.map((item) => item.fingerprint)
    );
  }
  await pgMarkTaskIdentitiesSeen(input.userId, collectTaskIdentities(items));

  const pending = items.filter((item) => {
    if (alreadySent.has(item.fingerprint)) return false;

    // Discovery de scrape: nunca no pós-sync; no cron só se identidade inédita.
    if (SYNC_NO_PUSH_KINDS.has(item.kind)) {
      if (source === "sync") return false;
      if (item.kind === "task") {
        const identity = taskIdentityKeyFromFingerprint(item.fingerprint);
        if (!identity) return false;
        if (seenTaskIdentities.has(identity)) return false;
        // Cron também não empurra "nova tarefa" — evita falso positivo.
        // Novas tarefas aparecem no sino; push fica para lembretes de prazo.
        return false;
      }
      return false;
    }

    return true;
  });

  const sent = await pushNewNotificationItems({
    userId: input.userId,
    tokens,
    items: pending,
    alreadySent: new Set(),
  });

  console.info(
    `[push] source=${source} pending=${pending.length} sent=${sent} (tasks baseline only)`
  );

  return { sent, skipped: sent === 0 };
}

export async function dispatchNotificationPushesForCpf(
  username: string,
  options?: { fallbackSyncToast?: boolean; source?: "sync" | "cron" }
): Promise<void> {
  const cpf = normalizeCpf(username);
  if (cpf.length !== 11) return;

  const resolved = await resolveCloudNotificationPrefsForCpf(cpf);
  if (!resolved) return;

  const source =
    options?.source ??
    (options?.fallbackSyncToast ? "sync" : "cron");

  await dispatchNotificationPushesForUser({
    userId: resolved.userId,
    cpf,
    source,
  });
}
