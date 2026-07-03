import { loadSigaaCredentials } from "@/lib/crypto/sigaa-credential-store";
import { loginSigaaOnPage } from "@/lib/scraper/auth";
import { SIGAA_SCRAPER_MOCK } from "@/lib/scraper/constants";
import { ScraperError } from "@/lib/scraper/errors";
import { withSyncBrowser } from "@/lib/scraper/session-context";
import type { SyncRequest } from "@/lib/types/sync";

function credentialsMatchStored(username: string, password: string): boolean {
  const stored = loadSigaaCredentials();
  if (!stored) return false;
  return stored.username === username.trim() && stored.password === password;
}

async function verifyLiveCredentials(credentials: SyncRequest): Promise<void> {
  await withSyncBrowser(async (page) => {
    await loginSigaaOnPage(page, {
      username: credentials.username,
      password: credentials.password,
    });
  });
}

/**
 * Valida usuário/senha SIGAA sem rodar o sync completo.
 */
export async function verifySigaaCredentials(
  credentials: SyncRequest
): Promise<void> {
  const username = credentials.username.trim();
  const password = credentials.password;

  if (!username || !password) {
    throw ScraperError.authFailed("Informe usuário e senha do SIGAA.");
  }

  if (SIGAA_SCRAPER_MOCK) {
    if (username.toLowerCase() === "offline") {
      throw ScraperError.offline();
    }
    return;
  }

  if (credentialsMatchStored(username, password)) {
    return;
  }

  await verifyLiveCredentials({
    username,
    password,
    savePassword: credentials.savePassword,
  });
}
