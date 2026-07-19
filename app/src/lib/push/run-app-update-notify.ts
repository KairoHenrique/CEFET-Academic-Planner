import { APP_RELEASE } from "@/config/app-download";
import { getPostgresPool } from "@/lib/db/postgres/pool";
import { notifyCpfDevices } from "@/lib/push/expo-push-send";
import { listAllDistinctPushTokens } from "@/lib/push/push-token-repository";
import {
  getAppConfigJson,
  setAppConfigJson,
} from "@/lib/sync-policy/app-config-store";

export const APP_UPDATE_LAST_NOTIFIED_KEY =
  "app_update_last_notified_version";

function compareSemver(left: string, right: string): number {
  const a = left
    .trim()
    .replace(/^v/i, "")
    .split(".")
    .map((part) => Number.parseInt(part.replace(/[^\d].*$/, ""), 10) || 0);
  const b = right
    .trim()
    .replace(/^v/i, "")
    .split(".")
    .map((part) => Number.parseInt(part.replace(/[^\d].*$/, ""), 10) || 0);
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i += 1) {
    const av = a[i] ?? 0;
    const bv = b[i] ?? 0;
    if (av < bv) return -1;
    if (av > bv) return 1;
  }
  return 0;
}

function readStoredVersion(raw: unknown): string | null {
  if (typeof raw === "string" && raw.trim()) return raw.trim();
  if (
    raw &&
    typeof raw === "object" &&
    "version" in raw &&
    typeof (raw as { version?: unknown }).version === "string"
  ) {
    return (raw as { version: string }).version.trim() || null;
  }
  return null;
}

export type AppUpdateNotifyResult = {
  ok: true;
  skipped: boolean;
  reason?: string;
  version?: string;
  tokenCount?: number;
};

/**
 * Se APP_RELEASE.version for mais nova que a última notificada,
 * dispara push genérico (sem PII) para todos os tokens e grava a versão.
 * Primeira execução só bootstrap (sem push) para não spammar a versão atual.
 */
export async function runAppUpdateNotifyCheck(): Promise<AppUpdateNotifyResult> {
  const currentVersion = APP_RELEASE.version.trim();
  if (!currentVersion) {
    return { ok: true, skipped: true, reason: "APP_RELEASE.version vazia." };
  }

  const storedRaw = await getAppConfigJson(APP_UPDATE_LAST_NOTIFIED_KEY);
  const lastNotified = readStoredVersion(storedRaw);

  if (!lastNotified) {
    await setAppConfigJson(APP_UPDATE_LAST_NOTIFIED_KEY, {
      version: currentVersion,
      notifiedAt: new Date().toISOString(),
      bootstrap: true,
    });
    return {
      ok: true,
      skipped: true,
      reason: "Bootstrap — versão atual registrada sem push.",
      version: currentVersion,
    };
  }

  if (compareSemver(lastNotified, currentVersion) >= 0) {
    return {
      ok: true,
      skipped: true,
      reason: "Versão já notificada.",
      version: currentVersion,
    };
  }

  const pool = getPostgresPool();
  const tokens = await listAllDistinctPushTokens(pool);

  if (tokens.length > 0) {
    await notifyCpfDevices({
      tokens,
      title: "ACME HUB — atualização",
      body: `A versão ${currentVersion} está disponível. Abra o app para baixar.`,
      data: {
        type: "app_update",
        version: currentVersion,
      },
    });
  }

  await setAppConfigJson(APP_UPDATE_LAST_NOTIFIED_KEY, {
    version: currentVersion,
    notifiedAt: new Date().toISOString(),
  });

  return {
    ok: true,
    skipped: false,
    version: currentVersion,
    tokenCount: tokens.length,
  };
}
