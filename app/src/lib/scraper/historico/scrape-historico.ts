import fs from "node:fs";
import path from "node:path";
import type { Page } from "playwright";
import {
  getActiveSigaaUsername,
  resolveUserDataDir,
} from "@/lib/db/connection-manager";
import {
  SIGAA_HISTORICO_PDF_PATH,
  SIGAA_PORTAL_DISCENTE_URL,
  SIGAA_SCRAPER_DEBUG,
} from "@/lib/scraper/constants";
import { ScraperError } from "@/lib/scraper/errors";
import {
  captureHistoricoPdfAfterEmitClick,
  captureHistoricoPdfFromMenu,
} from "@/lib/scraper/historico/capture-historico-pdf";
import {
  isHistoricoEmitPage,
  navigateToEmitirHistorico,
} from "@/lib/scraper/historico/navigate-to-historico";
import { parseHistoricoPdfBuffer } from "@/lib/scraper/historico/parse-historico-pdf";
import { buildMockHistoricoSnapshot } from "@/lib/scraper/historico/mock-historico-snapshot";
import { dumpScrapeHtml } from "@/lib/scraper/scrape-debug";
import {
  dismissSigaaBlockingOverlays,
  dismissSigaaCookieBanner,
} from "@/lib/scraper/turma-virtual/portal-turma-navigation";
import { countPersistableHistoricoDisciplinas } from "@/lib/sync/historico-snapshot-policy";
import type { HistoricoSnapshot } from "@/lib/scraper/types/historico";

/**
 * Navega até Ensino → Emitir Histórico no portal, baixa o PDF e extrai os dados.
 * O PDF do SIGAA costuma baixar direto no clique do menu (sem tela intermediária).
 */
export async function scrapeHistorico(
  page: Page,
  options?: { skipPortalGoto?: boolean }
): Promise<HistoricoSnapshot> {
  if (SIGAA_HISTORICO_PDF_PATH) {
    try {
      const buffer = fs.readFileSync(SIGAA_HISTORICO_PDF_PATH);
      const snapshot = await parseHistoricoPdfBuffer(buffer);
      console.info(
        `[scraper:historico] PDF local: ${snapshot.disciplinas.length} disciplina(s) parseada(s).`
      );
      return snapshot;
    } catch (error) {
      console.warn(
        `[scraper:historico] Falha ao ler PDF local (${SIGAA_HISTORICO_PDF_PATH}):`,
        error instanceof Error ? error.message : error
      );
    }
  }

  try {
    if (!options?.skipPortalGoto && !page.url().includes("discente")) {
      await page.goto(SIGAA_PORTAL_DISCENTE_URL, {
        waitUntil: "domcontentloaded",
        timeout: 30_000,
      });
    }

    await dismissSigaaCookieBanner(page);
    await dismissSigaaBlockingOverlays(page);

    let pdfBuffer = await captureHistoricoPdfFromMenu(page);

    if (!pdfBuffer) {
      console.info(
        "[scraper:historico] PDF direto do menu falhou — tentando tela de emissão."
      );
      const navigated = await navigateToEmitirHistorico(page, {
        skipReturnToPortal: options?.skipPortalGoto,
      });

      if (!navigated) {
        await dumpHistoricoDebugHtml(page, "falha-navegacao");
        return buildEmptySnapshot("navegação");
      }

      if (await isHistoricoEmitPage(page)) {
        await dumpHistoricoDebugHtml(page, "tela-emissao");
        pdfBuffer = await captureHistoricoPdfAfterEmitClick(page);
      }
    }

    if (!pdfBuffer) {
      console.warn("[scraper:historico] Não foi possível baixar o PDF do histórico.");
      await dumpHistoricoDebugHtml(page, "falha-download");
      return buildEmptySnapshot("download");
    }

    saveHistoricoPdfDebug(pdfBuffer);

    const snapshot = await parseHistoricoPdfBuffer(pdfBuffer);
    const persistable = countPersistableHistoricoDisciplinas(snapshot);
    console.info(
      `[scraper:historico] PDF SIGAA: ${snapshot.disciplinas.length} parseada(s), ${persistable} com situação final.`
    );

    if (persistable === 0) {
      console.warn("[scraper:historico] Parser retornou 0 disciplinas persistíveis.");
    }

    return snapshot;
  } catch (error) {
    if (error instanceof ScraperError) throw error;
    const message = error instanceof Error ? error.message : "Falha ao raspar histórico.";
    console.warn(`[scraper:historico] ${message}`);
    await dumpHistoricoDebugHtml(page, "erro");
    return buildEmptySnapshot("erro");
  }
}

async function dumpHistoricoDebugHtml(page: Page, section: string): Promise<void> {
  if (!SIGAA_SCRAPER_DEBUG) return;
  dumpScrapeHtml("historico", section, await page.content().catch(() => null));
}

function saveHistoricoPdfDebug(buffer: Buffer): void {
  if (!SIGAA_SCRAPER_DEBUG) return;

  const debugDir = path.join(
    resolveUserDataDir(getActiveSigaaUsername()),
    "scrape-debug"
  );
  
  // Limpa o diretório de debug antes de salvar o novo, 
  // garantindo que não acumulemos PDFs antigos.
  if (fs.existsSync(debugDir)) {
    fs.rmSync(debugDir, { recursive: true, force: true });
  }
  fs.mkdirSync(debugDir, { recursive: true });
  
  const filename = `${Date.now()}-historico-escolar.pdf`;
  fs.writeFileSync(path.join(debugDir, filename), buffer);
  console.info(`[scraper:debug] Diretório limpo. PDF salvo: .data/users/.../scrape-debug/${filename}`);
}

function buildEmptySnapshot(reason: string): HistoricoSnapshot {
  console.warn(`[scraper:historico] Snapshot vazio (${reason}).`);
  return {
    scrapedAt: new Date().toISOString(),
    disciplinas: [],
    chResumo: [],
  };
}

export function scrapeHistoricoMock(): HistoricoSnapshot {
  return buildMockHistoricoSnapshot();
}
