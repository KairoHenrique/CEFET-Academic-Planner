import { getMirrorPool, isSyncMirrorEnabled } from "@/lib/sync-mirror/mirror-config";
import { notifyCpfDevices } from "@/lib/push/expo-push-send";
import { listPushTokensByCpf } from "@/lib/push/push-token-repository";
import { normalizeCpf } from "@/lib/auth/account/cpf";

/**
 * Melhor esforço pós-sync: se o aluno tiver app logado com token, avisa.
 * Falhas não derrubam o pipeline do worker.
 */
export async function notifySyncCompletedPush(username: string): Promise<void> {
  try {
    if (!isSyncMirrorEnabled()) return;
    const cpf = normalizeCpf(username);
    if (cpf.length !== 11) return;

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
