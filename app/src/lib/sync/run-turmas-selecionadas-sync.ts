import { loginSigaaOnPage } from "@/lib/scraper/auth";
import { SIGAA_SCRAPER_MOCK } from "@/lib/scraper/constants";
import { withSyncBrowser } from "@/lib/scraper/session-context";
import { resolveSyncCredentialsSync } from "@/lib/sync/resolve-credentials";
import type { SyncRequest } from "@/lib/types/sync";
import { scrapeTurmasSelecionadas } from "@/lib/scraper/turmas-selecionadas/scrape-turmas-selecionadas";
import type { TurmaSelecionadaItem } from "@/lib/scraper/turmas-selecionadas/parse-turmas-selecionadas";

export async function runTurmasSelecionadasSync(
  input: SyncRequest
): Promise<TurmaSelecionadaItem[]> {
  const credentials = resolveSyncCredentialsSync(input);

  if (SIGAA_SCRAPER_MOCK) {
    return []; // Mock vazio
  }

  return withSyncBrowser(async (page) => {
    await loginSigaaOnPage(page, credentials);
    const turmas = await scrapeTurmasSelecionadas(page, credentials.password);
    
    console.log("========================================");
    console.log("[scraper:turmas-selecionadas] RESULTADO DA EXTRAÇÃO:");
    console.log(JSON.stringify(turmas, null, 2));
    console.log("========================================");

    return turmas;
  });
}
