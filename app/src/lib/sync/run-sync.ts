import {
  clearSigaaCredentials,
  persistSigaaCredentials,
} from "@/lib/crypto/sigaa-credential-store";
import { loginSigaaOnPage } from "@/lib/scraper/auth";
import { SIGAA_SCRAPER_MOCK } from "@/lib/scraper/constants";
import { withSyncBrowser } from "@/lib/scraper/session-context";
import { executeLiveSyncPipeline } from "@/lib/sync/execute-live-sync-pipeline";
import { executeMockSyncPipeline } from "@/lib/sync/execute-mock-sync-pipeline";
import {
  recordSyncCompletedAt,
  recordSyncedUsername,
} from "@/lib/sync/sync-preferences";
import { resolveSyncCredentials, type ResolvedSyncCredentials } from "@/lib/sync/resolve-credentials";
import type { SigaaSession } from "@/lib/scraper/types";
import type { SyncMode, SyncPipelineResult } from "@/lib/types/sync-pipeline";
import type { SyncRequest } from "@/lib/types/sync";

export interface RunSyncOptions {
  mode?: SyncMode;
}

export interface SyncResult extends SyncPipelineResult {
  session: SigaaSession;
}

function persistCredentialsPreference(
  credentials: ResolvedSyncCredentials
): void {
  if (credentials.savePassword) {
    persistSigaaCredentials(credentials.username, credentials.password);
    return;
  }
  clearSigaaCredentials();
}

function finalizeSuccessfulSync(
  credentials: ResolvedSyncCredentials,
  pipeline: SyncPipelineResult
): void {
  const anyStageOk = pipeline.stages.some((stage) => stage.outcome === "ok");
  if (!anyStageOk) {
    console.warn("[sync] Nenhuma etapa persistiu dados — last_run não atualizado.");
    return;
  }

  recordSyncCompletedAt();
  recordSyncedUsername(credentials.username);

  if (pipeline.partial) {
    console.warn("[sync] Concluído com avisos em uma ou mais etapas.");
  }
}

async function runMockSync(
  credentials: ResolvedSyncCredentials,
  mode: SyncMode
): Promise<SyncResult> {
  persistCredentialsPreference(credentials);
  const pipeline = await executeMockSyncPipeline(credentials, mode);
  finalizeSuccessfulSync(credentials, pipeline);
  return pipeline;
}

async function runLiveSync(
  credentials: ResolvedSyncCredentials,
  mode: SyncMode
): Promise<SyncResult> {
  return withSyncBrowser(async (page) => {
    await loginSigaaOnPage(page, credentials);
    persistCredentialsPreference(credentials);

    const session: SigaaSession = {
      username: credentials.username,
      cookies: await page.context().cookies(),
      loggedInAt: new Date().toISOString(),
    };

    const pipeline = await executeLiveSyncPipeline(page, mode);
    finalizeSuccessfulSync(credentials, pipeline);

    return { ...pipeline, session };
  });
}

export async function runSync(
  input: SyncRequest,
  options: RunSyncOptions = {}
): Promise<SyncResult> {
  const credentials = resolveSyncCredentials(input);
  const mode = options.mode ?? "full";

  console.info(
    `[sync] modo=${SIGAA_SCRAPER_MOCK ? "MOCK" : "LIVE"} pipeline=${mode} user=${credentials.username}`
  );

  if (SIGAA_SCRAPER_MOCK) {
    return runMockSync(credentials, mode);
  }

  return runLiveSync(credentials, mode);
}
