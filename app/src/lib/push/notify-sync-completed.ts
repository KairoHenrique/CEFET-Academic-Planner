/**
 * Melhor esforço pós-sync: se o aluno tiver APK logado com token, avisa
 * itens/lembretes ativos alinhados às prefs do perfil (Postgres).
 *
 * No worker do PC (SQLite + mirror), encaminha para a cloud via CRON_SECRET —
 * assim prefs e tokens usam o mesmo Postgres do app.
 * Falhas não derrubam o pipeline do worker.
 */

import { normalizeCpf } from "@/lib/auth/account/cpf";
import { isPostgresBackend } from "@/lib/db/backend/config";
import { dispatchNotificationPushesForCpf } from "@/lib/push/dispatch-notification-pushes";
import { isSyncMirrorEnabled } from "@/lib/sync-mirror/mirror-config";

async function forwardPushToCloud(username: string): Promise<void> {
  const base = (
    process.env.PLANNER_APP_URL?.trim() ||
    process.env.PLANNER_HEALTH_URL?.trim() ||
    ""
  ).replace(/\/$/, "");
  const secret = process.env.CRON_SECRET?.trim();
  if (!base || !secret) {
    console.warn(
      "[push] Sem PLANNER_APP_URL/CRON_SECRET — push pós-sync omitido no worker."
    );
    return;
  }

  const cpf = normalizeCpf(username);
  if (cpf.length !== 11) return;

  const response = await fetch(`${base}/api/cron/notification-push-user`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${secret}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ cpf, fallbackSyncToast: true }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    console.warn(
      `[push] Cloud push HTTP ${response.status}: ${text.slice(0, 160)}`
    );
  }
}

export async function notifySyncCompletedPush(username: string): Promise<void> {
  try {
    if (!isSyncMirrorEnabled() && !isPostgresBackend()) return;

    if (isPostgresBackend()) {
      await dispatchNotificationPushesForCpf(username, {
        fallbackSyncToast: true,
      });
      return;
    }

    await forwardPushToCloud(username);
  } catch (error) {
    console.warn(
      "[push] Falha ao notificar sync:",
      error instanceof Error ? error.message : error
    );
  }
}
