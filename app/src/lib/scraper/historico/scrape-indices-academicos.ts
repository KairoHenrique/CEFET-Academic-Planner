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
    // Em vez de usar locator.click (que pode falhar se o menu estiver oculto/colapsado),
    // vamos avaliar um script na página para procurar o texto e disparar o clique/submit nativo.
    const menuClicked = await page.evaluate(() => {
      const tds = Array.from(document.querySelectorAll('td.ThemeOfficeMenuItemText'));
      const targetTd = tds.find(td => td.textContent?.trim().includes('Índices Acadêmicos') || td.textContent?.trim().includes('Minhas Notas'));
      
      if (!targetTd) return false;
      
      // O clique pode estar no TR ou no TD
      let clickTarget: HTMLElement = targetTd as HTMLElement;
      if (targetTd.parentElement && targetTd.parentElement.tagName === 'TR') {
        clickTarget = targetTd.parentElement as HTMLElement;
      }
      
      clickTarget.click();
      return true;
    });

    if (!menuClicked) {
      console.warn("[scraper:historico] Não encontrou o menu Consultar Índices Acadêmicos ou Minhas Notas!");
    }
    
    await responsePromise;
    await page.waitForLoadState("domcontentloaded", { timeout: SIGAA_NAVIGATION_TIMEOUT_MS }).catch(() => null);
    
    await dumpDebugHtml(page, "indices-academicos");

    // 3. Extrair as tabelas de disciplinas e o curso
    const extractedData = await extractDisciplinasFromIndicesPage(page);

    console.info(`[scraper:historico] Extraídas ${extractedData.disciplinas.length} disciplinas da página de Índices Acadêmicos. Curso: ${extractedData.curso}`);

    return {
      scrapedAt: new Date().toISOString(),
      curso: extractedData.curso,
      disciplinas: extractedData.disciplinas,
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

async function extractDisciplinasFromIndicesPage(page: Page): Promise<{ disciplinas: HistoricoDisciplinaEntry[], curso?: string }> {
  // A página de Índices Acadêmicos possui várias tabelas agrupadas por semestre.
  // Vamos buscar a tabela principal
  
  const entries = await page.evaluate(() => {
    const disciplinas: HistoricoDisciplinaEntry[] = [];
    let curso: string | undefined;
    
    // Tenta extrair o curso procurando a palavra "Curso:" em todo o HTML
    const match = document.body.textContent?.match(/Curso:\s*(.+?)(?=\n|$)/i);
    if (match && match[1]) {
      curso = match[1].trim();
    }
    
    // Procura por todas as tabelas na página
    const tables = Array.from(document.querySelectorAll('table'));
    if (!tables || tables.length === 0) return { disciplinas, curso };
    
    for (const table of tables) {
      // Verifica se a tabela parece ser uma tabela de disciplinas
      const headerText = table.textContent?.toLowerCase() || "";
      if (!headerText.includes("código") || !headerText.includes("disciplina") || !headerText.includes("situação")) {
        continue;
      }

      const rows = Array.from(table.querySelectorAll('tr'));
      let currentSemestre = "";
      let colCod = 0, colDis = 1, colRes = -1, colFal = -1, colSit = -1;
      let foundHeader = false;
      
      for (const row of rows) {
        const rowText = row.textContent?.trim() || "";
        
        // Se a linha tem apenas 1 ou 2 células e contém um ano.semestre (ex: 2025.2), é um agrupador
        if (row.cells.length <= 2 && /^\d{4}\.\d$/.test(rowText)) {
          currentSemestre = rowText;
          continue;
        }
        
        // Se a linha tem class agrupador
        if (row.classList.contains('agrupador')) {
          currentSemestre = rowText || currentSemestre;
          continue;
        }
        
        const cells = Array.from(row.querySelectorAll('td, th'));
        
        // Tenta identificar o cabeçalho para mapear as colunas
        if (!foundHeader) {
          const headerTexts = cells.map(c => c.textContent?.trim().toLowerCase() || "");
          const hasCodigo = headerTexts.some(t => t.includes("código"));
          if (hasCodigo) {
            colCod = headerTexts.findIndex(t => t.includes("código"));
            colDis = headerTexts.findIndex(t => t.includes("disciplina"));
            colSit = headerTexts.findIndex(t => t.includes("situação"));
            colRes = headerTexts.findIndex(t => t.includes("resultado"));
            colFal = headerTexts.findIndex(t => t.includes("faltas"));
            foundHeader = true;
            continue;
          }
        }
        
        // Se ainda não achou o cabeçalho ou tem poucas células, pula
        if (!foundHeader || cells.length < 3) continue;
        
        // Se a linha é o próprio cabeçalho sendo repetido, pula
        const txtCod = cells[colCod]?.textContent?.trim().toLowerCase() || "";
        if (txtCod === "código") continue;
        
        const codigo = cells[colCod]?.textContent?.trim() || "";
        const nome = cells[colDis]?.textContent?.trim() || "";
        const resultado = colRes >= 0 ? (cells[colRes]?.textContent?.trim() || "") : "";
        const situacao = colSit >= 0 ? (cells[colSit]?.textContent?.trim() || "") : "";
        
        if (!codigo || !nome) {
          continue;
        }
        
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
        
        disciplinas.push({
          semestre: currentSemestre,
          codigo: codigo,
          nome: nome,
          situacao: situacao,
          ch: 0, // Será resolvido no backend pelo banco de dados PPC
          horaAula: 0, // Será resolvido no backend
          frequencia: null, // Ignorado
          media: media,
          conceito: isNaN(parseFloat(resultado.replace(",","."))) && resultado !== "-" && resultado !== "" ? resultado : null,
          optativo: false,
        });
      }
    }
    
    return { disciplinas, curso };
  });
  
  return entries;
}

async function dumpDebugHtml(page: Page, section: string): Promise<void> {
  if (!SIGAA_SCRAPER_DEBUG) return;
  dumpScrapeHtml("historico", section, await page.content().catch(() => null));
}
