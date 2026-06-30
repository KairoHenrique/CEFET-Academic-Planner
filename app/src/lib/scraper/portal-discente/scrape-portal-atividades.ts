import type { Page } from "playwright";
import {
  SIGAA_NAVIGATION_TIMEOUT_MS,
  SIGAA_PORTAL_DISCENTE_URL,
} from "@/lib/scraper/constants";
import { dumpScrapeHtml } from "@/lib/scraper/scrape-debug";
import { parseAtividadeDetalheHtml } from "@/lib/scraper/turma-virtual/parse-tarefas-page";
import { sleep } from "@/lib/scraper/turma-virtual/html-utils";
import type { PortalAtividadePendente } from "@/lib/scraper/types/portal-discente";

const MAX_ATIVIDADE_CLICKS = 20;

interface AtividadeLinkTarget {
  linkId: string;
  titulo: string;
}

async function collectAtividadeLinks(page: Page): Promise<AtividadeLinkTarget[]> {
  return page.evaluate(() => {
    const form = document.getElementById("formAtividades");
    if (!form) return [];

    return Array.from(
      form.querySelectorAll(
        'a[id*="visualizarTarefa"], a[id*="visualizarQuestionario"], a[id*="visualizarAvaliacao"]'
      )
    )
      .map((anchor) => ({
        linkId: anchor.id,
        titulo: (anchor.textContent ?? "").replace(/\s+/g, " ").trim(),
      }))
      .filter((item) => item.linkId && item.titulo);
  });
}

function normalizeAtividadeTitulo(value: string): string {
  return value.replace(/\s+/g, " ").trim().toLowerCase();
}

function findAtividadeForLink(
  atividades: PortalAtividadePendente[],
  link: AtividadeLinkTarget
): PortalAtividadePendente | undefined {
  if (link.linkId) {
    const byId = atividades.find((item) => item.linkId === link.linkId);
    if (byId) return byId;
  }

  const normalized = normalizeAtividadeTitulo(link.titulo);
  return atividades.find(
    (item) => normalizeAtividadeTitulo(item.titulo) === normalized
  );
}

const ATIVIDADE_DETALHE_PAGE_PATTERN =
  /responder\s+tarefa|nome\s+da\s+tarefa|visualizarQuestionario|descricaoOperacao|Acessar\s+Question[aá]rio/i;

async function extractAtividadeDetalheHtml(page: Page): Promise<string | null> {
  try {
    await page.waitForSelector("fieldset.responderTarefa, .descricaoOperacao", {
      timeout: 6000,
    });
  } catch {
    return null;
  }

  return page.evaluate(() => {
    const fieldset = document.querySelector("fieldset.responderTarefa");
    if (fieldset) return fieldset.outerHTML;

    const questionarioForm = document.querySelector(
      'form[action*="visualizarQuestionario"]'
    );
    if (questionarioForm) return questionarioForm.innerHTML;

    return null;
  });
}

/**
 * Clica nos links de "Minhas atividades" no portal e preenche descrição/instruções.
 */
export async function enrichPortalAtividadesComDetalhes(
  page: Page,
  atividades: PortalAtividadePendente[]
): Promise<void> {
  if (atividades.length === 0) return;

  if (!page.url().includes("discente.jsf")) {
    await page.goto(SIGAA_PORTAL_DISCENTE_URL, {
      waitUntil: "domcontentloaded",
      timeout: SIGAA_NAVIGATION_TIMEOUT_MS,
    });
    await sleep(800);
  }

  const links = await collectAtividadeLinks(page);
  if (links.length === 0) {
    console.warn("[scraper:portal] Nenhum link de atividade encontrado em Minhas atividades.");
    return;
  }

  console.info(
    `[scraper:portal] Enriquecendo ${Math.min(links.length, MAX_ATIVIDADE_CLICKS)} atividade(s) via link direto…`
  );

  for (const link of links.slice(0, MAX_ATIVIDADE_CLICKS)) {
    const atividade = findAtividadeForLink(atividades, link);
    if (!atividade) continue;

    const clicked = await page.evaluate((linkId) => {
      const anchor = document.getElementById(linkId) as HTMLAnchorElement | null;
      if (!anchor) return false;
      anchor.click();
      return true;
    }, link.linkId);

    if (!clicked) continue;

    await page.waitForLoadState("domcontentloaded").catch(() => undefined);

    const html = await extractAtividadeDetalheHtml(page);
    if (!html || !ATIVIDADE_DETALHE_PAGE_PATTERN.test(html)) {
      await page.goto(SIGAA_PORTAL_DISCENTE_URL, {
        waitUntil: "domcontentloaded",
        timeout: SIGAA_NAVIGATION_TIMEOUT_MS,
      });
      await sleep(600);
      continue;
    }

    dumpScrapeHtml(atividade.disciplinaCodigo, `atividade-${link.titulo}`, html);

    const detalhe = parseAtividadeDetalheHtml(html);
    if (detalhe.descricao) atividade.descricao = detalhe.descricao;
    if (detalhe.instrucoes.length > 0) atividade.instrucoes = detalhe.instrucoes;
    if (detalhe.entregaveis.length > 0) atividade.entregaveis = detalhe.entregaveis;

    await page.goto(SIGAA_PORTAL_DISCENTE_URL, {
      waitUntil: "domcontentloaded",
      timeout: SIGAA_NAVIGATION_TIMEOUT_MS,
    });
    await sleep(600);
  }
}
