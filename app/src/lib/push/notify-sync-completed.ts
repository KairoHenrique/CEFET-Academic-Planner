import { getMirrorPool, isSyncMirrorEnabled } from "@/lib/sync-mirror/mirror-config";
import { notifyCpfDevices } from "@/lib/push/expo-push-send";
import { listPushTokensByCpf } from "@/lib/push/push-token-repository";
import { normalizeCpf } from "@/lib/auth/account/cpf";
import { runWithUserDb } from "@/lib/db/connection-manager";
import { getNotificationPreferences } from "@/lib/notifications/notification-preferences";

/**
 * Melhor esforço pós-sync: se o aluno tiver APK logado com token, avisa.
 * Falhas não derrubam o pipeline do worker.
 * Respeita prefs: se todas as categorias acadêmicas estiverem off, não envia.
 */
export async function notifySyncCompletedPush(username: string): Promise<void> {
  try {
    if (!isSyncMirrorEnabled()) return;
    const cpf = normalizeCpf(username);
    if (cpf.length !== 11) return;

    const allowPush = runWithUserDb(username, () => {
      const prefs = getNotificationPreferences();
      return (
        prefs.tasks ||
        prefs.grades ||
        prefs.taskReminders ||
        prefs.calendarReminders ||
        prefs.integralizacaoAlerts ||
        prefs.academicDateAlerts
      );
    });
    if (!allowPush) {
      console.info("[push] Sync OK — push omitido (prefs desligadas).");
      return;
    }

    const pool = getMirrorPool();
    const tokens = await listPushTokensByCpf(pool, cpf);
    if (tokens.length === 0) return;

    await notifyCpfDevices({
      tokens,
      title: "ACME HUB",
      body: "Seus dados acadêmicos foram atualizados.",
      data: { type: "sync_completed" },
    });
  } catch (error) {
    console.warn(
      "[push] Falha ao notificar sync:",
      error instanceof Error ? error.message : error
    );
  }
}
