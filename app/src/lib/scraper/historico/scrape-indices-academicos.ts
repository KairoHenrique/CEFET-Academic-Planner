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
    let menuClicked = await clickMenu(page, 'Índices Acadêmicos');
    
    let disciplinas: HistoricoDisciplinaEntry[] = [];
    let curso: string | undefined;

    if (menuClicked) {
      await dumpDebugHtml(page, "indices-academicos");
      const extracted = await extractDisciplinasFromIndicesPage(page);
      disciplinas = extracted.disciplinas;
      if (extracted.curso) curso = extracted.curso;
    } else {
      console.warn("[scraper:historico] Não encontrou o menu Consultar Índices Acadêmicos!");
    }

    // 3. Navegar para Minhas Notas para pegar as do semestre atual
    console.info("[scraper:historico] Retornando ao Portal do Discente...");
    await page.goto("https://sig.cefetmg.br/sigaa/portais/discente/discente.jsf");
    await page.waitForLoadState("domcontentloaded");
    
    console.info("[scraper:historico] Navegando para Consultar Minhas Notas...");
    const menuNotasClicked = await clickMenu(page, 'Minhas Notas');
    
    if (menuNotasClicked) {
      await dumpDebugHtml(page, "minhas-notas");
      const extracted = await extractDisciplinasFromIndicesPage(page);
      
      // Adicionar apenas as que já não foram adicionadas (evitar duplicatas pelo código)
      for (const d of extracted.disciplinas) {
        if (!disciplinas.some(existing => existing.codigo === d.codigo)) {
          disciplinas.push(d);
        }
      }
      if (!curso && extracted.curso) curso = extracted.curso;
    } else {
      console.warn("[scraper:historico] Não encontrou o menu Minhas Notas!");
    }

    console.info(`[scraper:historico] Extraídas ${disciplinas.length} disciplinas totais. Curso: ${curso}`);

    return {
      scrapedAt: new Date().toISOString(),
      curso,
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

async function clickMenu(page: Page, text: string): Promise<boolean> {
  // O menu pai é 'Ensino' ou 'Pesquisa', mas no nosso caso é Ensino.
  // Vamos focar no menu Ensino primeiro
  try {
    const ensinoLocator = page.locator('td').filter({ hasText: /^Ensino\s*/ }).first();
    await ensinoLocator.hover({ timeout: 2000 });
    await page.waitForTimeout(300); // Aguarda a animação do JSCookMenu
    
    const targetLocator = page.locator('td').filter({ hasText: text }).first();
    const count = await targetLocator.count();
    if (count === 0) {
      console.warn(`Menu item ${text} não encontrado após hover em Ensino`);
      return false;
    }
    
    const navigationPromise = page.waitForNavigation({ timeout: SIGAA_NAVIGATION_TIMEOUT_MS }).catch(() => null);
    await targetLocator.click();
    await navigationPromise;
    return true;
  } catch (e) {
    console.warn(`Falha no clickMenu nativo para ${text}:`, e);
    return false;
  }
}

async function extractDisciplinasFromIndicesPage(page: Page): Promise<{ disciplinas: HistoricoDisciplinaEntry[], curso?: string }> {
  // A página de Índices Acadêmicos possui várias tabelas agrupadas por semestre.
  // Vamos buscar a tabela principal
  
  const entries = await page.evaluate(() => {
    try {
      const disciplinas: any[] = [];
      let curso: string | undefined;
      
      if (!document.body) return { disciplinas, curso };
      
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
      const headerText = (table.textContent || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
      if (!headerText.includes("codigo") || !headerText.includes("disciplina") || !headerText.includes("situacao")) {
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
          console.log("Agrupador semestre encontrado:", currentSemestre);
          continue;
        }
        
        // Se a linha tem class agrupador
        if (row.classList.contains('agrupador')) {
          currentSemestre = rowText || currentSemestre;
          console.log("Agrupador classe encontrado:", currentSemestre);
          continue;
        }
        
        const cells = Array.from(row.querySelectorAll('td, th'));
        
        // Tenta identificar o cabeçalho para mapear as colunas
        if (!foundHeader) {
          const headerTexts = cells.map(c => (c.textContent || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim());
          const hasCodigo = headerTexts.some(t => t.includes("codigo"));
          
          if (hasCodigo) {
            colCod = headerTexts.findIndex(t => t.includes("codigo"));
            colDis = headerTexts.findIndex(t => t.includes("disciplina"));
            colSit = headerTexts.findIndex(t => t.includes("situacao"));
            colRes = headerTexts.findIndex(t => t.includes("resultado"));
            colFal = headerTexts.findIndex(t => t.includes("faltas"));
            foundHeader = true;
            console.log(`Header found! colCod:${colCod}, colDis:${colDis}, colSit:${colSit}`);
            continue;
          }
        }
        
        // Se ainda não achou o cabeçalho ou tem poucas células, pula
        if (!foundHeader || cells.length < 3) {
          if (foundHeader) console.log("Skipped due to cells.length < 3:", cells.length);
          continue;
        }
        
        // Ajusta índices se a linha não tiver o td do rowspan do semestre (Minhas Notas)
        // Isso acontece porque o th tem o semestre (ou a primeira td do semestre), e as próximas td não têm
        // Então as células ficam deslocadas em -1
        let actColCod = colCod;
        let actColDis = colDis;
        let actColSit = colSit;
        let actColRes = colRes;
        
        // Verifica se esta linha tem menos colunas que o header que encontramos, o que indica rowspan
        if (cells.length < 8 && colSit === 7) {
            // Em Minhas Notas, colSit é 7 no cabeçalho (que tem 8 células: semestre + 7 colunas)
            // Nas linhas de disciplina, temos 7 células
            actColCod = 0;
            actColDis = 1;
            actColRes = 5;
            actColSit = 6;
        }
        
        // Se a linha é o próprio cabeçalho sendo repetido, pula
        const txtCod = (cells[actColCod]?.textContent || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
        if (txtCod === "codigo") continue;
        
        const codigo = cells[actColCod]?.textContent?.trim() || "";
        const nome = cells[actColDis]?.textContent?.trim() || "";
        const resultado = actColRes >= 0 ? (cells[actColRes]?.textContent?.trim() || "") : "";
        const situacao = actColSit >= 0 ? (cells[actColSit]?.textContent?.trim() || "") : "";
        
        console.log(`Row parsing: cod="${codigo}", nome="${nome}", sit="${situacao}"`);

        if (!codigo || !nome) {
          console.log("Skipped because empty codigo or nome");
          continue;
        }
        
        const sitUpper = situacao.toUpperCase();
        // Permite todas as situações, pois precisamos pegar as que ele está MATRICULADO nas Minhas Notas
        // e também as que ele reprovou para o histórico ficar completo.
        
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
    } catch (e: any) {
      console.error("Error inside evaluate extractDisciplinas:", e.message || e);
      return { disciplinas: [], curso: undefined };
    }
  });
  
  return entries;
}

async function dumpDebugHtml(page: Page, section: string): Promise<void> {
  if (!SIGAA_SCRAPER_DEBUG) return;
  dumpScrapeHtml("historico", section, await page.content().catch(() => null));
}
