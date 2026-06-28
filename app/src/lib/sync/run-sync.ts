import {
  clearSigaaCredentials,
  persistSigaaCredentials,
} from "@/lib/crypto/sigaa-credential-store";
import { loginSigaa } from "@/lib/scraper/auth";
import { ScraperError, mapUnknownScraperError } from "@/lib/scraper/errors";
import { scrapePortalDiscente } from "@/lib/scraper/portal-discente/scrape-portal-discente";
import type { SigaaSession } from "@/lib/scraper/types";
import { persistPortalSnapshot } from "@/lib/sync/persist-portal-snapshot";
import { resolveSyncCredentials } from "@/lib/sync/resolve-credentials";
import type { SyncRequest, SyncStep } from "@/lib/types/sync";

/**
 * Sync pipeline: dados do SIGAA entram via upsert e nunca sobrescrevem
 * registros protegidos pelo usuário — ver lib/sync/user-data-priority.ts.
 */

export interface SyncResult {
  steps: SyncStep[];
  session: SigaaSession;
}

async function authenticateSigaa(
  credentials: ReturnType<typeof resolveSyncCredentials>
): Promise<SigaaSession> {
  try {
    return await loginSigaa({
      username: credentials.username,
      password: credentials.password,
    });
  } catch (error) {
    if (error instanceof ScraperError) {
      throw error.toApiError();
    }
    throw mapUnknownScraperError(error).toApiError();
  }
}

async function syncPortalDiscente(session: SigaaSession): Promise<void> {
  try {
    const snapshot = await scrapePortalDiscente(session);
    persistPortalSnapshot(snapshot);
  } catch (error) {
    if (error instanceof ScraperError) {
      throw error.toApiError();
    }
    throw mapUnknownScraperError(error).toApiError();
  }
}

function persistCredentialsPreference(
  credentials: ReturnType<typeof resolveSyncCredentials>
): void {
  if (credentials.savePassword) {
    persistSigaaCredentials(credentials.username, credentials.password);
    return;
  }

  clearSigaaCredentials();
}

export async function runSync(input: SyncRequest): Promise<SyncResult> {
  const credentials = resolveSyncCredentials(input);
  const session = await authenticateSigaa(credentials);
  persistCredentialsPreference(credentials);

  const steps: SyncStep[] = [
    { label: "Autenticando no SIGAA…", progress: 15 },
  ];

  steps.push({ label: "Carregando portal do discente…", progress: 35 });
  await syncPortalDiscente(session);

  steps.push({ label: "Sincronizando disciplinas…", progress: 55 });
  steps.push({ label: "Baixando notas e faltas…", progress: 75 });
  steps.push({ label: "Atualizando calendário…", progress: 90 });
  steps.push({ label: "Concluído", progress: 100 });

  return { steps, session };
}
