import type { Page } from "playwright";
import { SIGAA_NAVIGATION_TIMEOUT_MS, SIGAA_SCRAPER_DEBUG } from "@/lib/scraper/constants";
import { ScraperError } from "@/lib/scraper/errors";
import type { HistoricoDisciplinaEntry, HistoricoSnapshot } from "@/lib/scraper/types/historico";
import { extractPortalRawFromPage } from "@/lib/scraper/portal-discente/extract-portal-raw";
import { parsePortalPageData } from "@/lib/scraper/portal-discente/parse-portal-page";
import { dumpScrapeHtml } from "@/lib/scraper/scrape-debug";

export async function scrapeIndicesAcademicos(page: Page): Promise<HistoricoSnapshot> {
  try {
    // 1. Extrair os dados da página principal para pegar a Integralização
    const portalRaw = await extractPortalRawFromPage(page);
    const portalData = parsePortalPageData(portalRaw);
    
    // Mapear Integralização do Portal para o formato do Historico
    const chResumo = portalData.integralizacao.map(item => ({
      tipo: item.tipoCh,
      exigido: item.totalNecessario ?? 0,
      integralizado: item.concluido ?? 0,
      pendente: item.pendente ?? 0,
    }));
    
    const chTotais = {
      exigido: portalData.integralizacaoResumo.totalCurriculo ?? 0,
      integralizado: Math.round((portalData.integralizacaoResumo.totalCurriculo ?? 0) * (portalData.integralizacaoResumo.percentIntegralizado ?? 0) / 100),
      pendente: chResumo.reduce((acc, curr) => acc + curr.pendente, 0)
    };

    // 2. Navegar para a página de Índices Acadêmicos
    console.info("[scraper:historico] Navegando para Consultar Índices Acadêmicos...");
    
    const responsePromise = page.waitForResponse(
      (resp) => resp.request().method() === "POST" && /discente\.jsf|indicesAcademicos/i.test(resp.url()),
      { timeout: SIGAA_NAVIGATION_TIMEOUT_MS }
    ).catch(() => null);

    // JSCookMenu usa eventos JS na tabela/linha
    await page.locator('td').filter({ hasText: /^Consultar Índices Acadêmicos$/ }).click({ force: true });
    
    await responsePromise;
    await page.waitForLoadState("domcontentloaded", { timeout: SIGAA_NAVIGATION_TIMEOUT_MS }).catch(() => null);
    
    await dumpDebugHtml(page, "indices-academicos");

    // 3. Extrair as tabelas de disciplinas
    const disciplinas = await extractDisciplinasFromIndicesPage(page);

    console.info(`[scraper:historico] Extraídas ${disciplinas.length} disciplinas da página de Índices Acadêmicos.`);

    return {
      scrapedAt: new Date().toISOString(),
      disciplinas,
      chResumo,
      chTotais,
    };
  } catch (error) {
    if (error instanceof ScraperError) throw error;
    const message = error instanceof Error ? error.message : "Falha ao extrair Índices Acadêmicos.";
    console.warn(`[scraper:historico] ${message}`);
    await dumpDebugHtml(page, "erro-indices");
    return {
      scrapedAt: new Date().toISOString(),
      disciplinas: [],
      chResumo: [],
    };
  }
}

async function extractDisciplinasFromIndicesPage(page: Page): Promise<HistoricoDisciplinaEntry[]> {
  // A página de Índices Acadêmicos possui várias tabelas agrupadas por semestre.
  // Vamos buscar a tabela principal (geralmente class = "listagem" ou similar)
  
  const entries = await page.evaluate(() => {
    const disciplinas: HistoricoDisciplinaEntry[] = [];
    
    // Procura por todas as tabelas listagem
    const tables = document.querySelectorAll('table.listagem');
    if (!tables || tables.length === 0) return [];
    
    // A tabela master tem thead com as colunas (Código, Disciplina, Unidade 1, etc)
    // E tr.agrupador com o semestre (ex: 2025.2)
    // E tr class="linhaImpar" ou "linhaPar" com as disciplinas.
    
    for (const table of tables) {
      const rows = Array.from(table.querySelectorAll('tr'));
      let currentSemestre = "";
      
      for (const row of rows) {
        if (row.classList.contains('agrupador')) {
          currentSemestre = row.textContent?.trim() || currentSemestre;
          continue;
        }
        
        if (row.classList.contains('linhaImpar') || row.classList.contains('linhaPar')) {
          const cells = Array.from(row.querySelectorAll('td'));
          if (cells.length < 7) continue;
          
          const codigo = cells[0].textContent?.trim() || "";
          const nome = cells[1].textContent?.trim() || "";
          // cell 2: Unidade 1, cell 3: Recuperação, cell 4: Resultado
          const resultado = cells[4].textContent?.trim() || "";
          const faltas = cells[5].textContent?.trim() || "";
          const situacao = cells[6].textContent?.trim() || "";
          
          if (!codigo || !nome) continue;
          
          // O usuário pediu especificamente para ignorar REPROVADO ou vazios.
          // Pegar apenas aprovados ou dispensados (créditos aproveitados).
          const sitUpper = situacao.toUpperCase();
          if (!sitUpper.includes("APROVADO") && !sitUpper.includes("DISPENSADO") && !sitUpper.includes("INCORPORADO") && !sitUpper.includes("CUMPRIDO")) {
            continue;
          }
          
          // Parse Resultado
          let media: number | null = null;
          if (resultado && resultado !== "-" && resultado !== "--") {
            const numStr = resultado.replace(",", ".");
            const num = parseFloat(numStr);
            if (!isNaN(num)) media = num;
          }
          
          // Parse Faltas
          let frequencia: number | null = null;
          
          disciplinas.push({
            semestre: currentSemestre,
            codigo: codigo,
            nome: nome,
            situacao: situacao,
            ch: 0, // Será resolvido no backend pelo banco de dados PPC
            horaAula: 0, // Será resolvido no backend
            frequencia: frequencia, // Ignorado
            media: media,
            conceito: isNaN(parseFloat(resultado.replace(",","."))) && resultado !== "-" && resultado !== "" ? resultado : null,
            optativo: false,
          });
        }
      }
    }
    
    return disciplinas;
  });
  
  return entries;
}

async function dumpDebugHtml(page: Page, section: string): Promise<void> {
  if (!SIGAA_SCRAPER_DEBUG) return;
  dumpScrapeHtml("historico", section, await page.content().catch(() => null));
}
