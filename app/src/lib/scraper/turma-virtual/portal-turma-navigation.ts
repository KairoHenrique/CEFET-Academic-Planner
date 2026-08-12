import type { Page } from "playwright";
import {
  SIGAA_NAVIGATION_TIMEOUT_MS,
  SIGAA_PORTAL_DISCENTE_URL,
} from "@/lib/scraper/constants";
import { dumpScrapeHtml } from "@/lib/scraper/scrape-debug";
import { hasParsableFrequencia } from "@/lib/scraper/turma-virtual/parse-frequencia-page";
import { hasParsableNotas } from "@/lib/scraper/turma-virtual/parse-notas-page";
import { sleep } from "@/lib/scraper/turma-virtual/html-utils";
import type { PortalDisciplinaSemestre } from "@/lib/scraper/types/portal-discente";
import type { TurmaVirtualIndexEntry } from "@/lib/scraper/types/turma-virtual";

const SEMESTRE_LINK_PATTERN = /\(\d{4}\.\d\)$/;
const TURMA_VIRTUAL_HREF_PATTERN = /\/ava\//i;

interface TurmaSubpageConfig {
  key: string;
  menuPatterns: RegExp[];
  expandMenuPattern?: RegExp;
  urlPatterns: RegExp[];
  contentPatterns: RegExp[];
  validateHtml?: (html: string) => boolean;
  waitTimeoutMs?: number;
}

const TURMA_SUBPAGES: TurmaSubpageConfig[] = [
  {
    key: "notas",
    menuPatterns: [
      /^ver\s*notas$/i,
      /^notas$/i,
      /visualizar\s*notas/i,
      /notas\s*do\s*aluno/i,
    ],
    expandMenuPattern: /^alunos$/i,
    urlPatterns: [/\/ava\/VerNotas/i, /\/ava\/index\.jsf/i, /\/ava\//i],
    contentPatterns: [
      /abrevAval_\d+/i,
      /id=["']trAval["']/i,
      /ALUNOS\s*MATRICULADOS/i,
      /<t[dh][^>]*>\s*(PRO\d|P\d|NP\d|SEM|AT\d|AV\d|TR\d)\s*<\/t[dh]>/i,
      /matr[ií]cula[\s\S]{0,1200}(pro\d|p\d|sem|at\d|av\d)/i,
    ],
    validateHtml: hasParsableNotas,
    waitTimeoutMs: 7000,
  },
  {
    key: "frequencia",
    menuPatterns: [/^frequ[eê]ncia$/i],
    expandMenuPattern: /^alunos$/i,
    urlPatterns: [/\/ava\/FrequenciaAluno/i],
    contentPatterns: [
      /Mapa de Frequ[eê]ncias/i,
      /class=["'][^"']*listing[^"']*["']/i,
      /\d{2}\/\d{2}\/\d{4}/,
      /Presente|\d+\s+Falta|Faltou|N[aã]o\s+Registrad/i,
    ],
    validateHtml: hasParsableFrequencia,
    waitTimeoutMs: 8000,
  },
  {
    key: "grupo",
    menuPatterns: [/^ver\s*grupo$|^participantes$/i],
    expandMenuPattern: /^alunos$/i,
    urlPatterns: [/\/ava\/GrupoDiscentes/i, /\/ava\/Participantes/i, /\/ava\//i],
    contentPatterns: [/grupo|participantes|e-?mail|matr[ií]cula/i],
  },
];

/* ---------- helpers ---------- */

export async function dismissSigaaCookieBanner(page: Page): Promise<void> {
  const ciente = page
    .getByRole("button", { name: /ciente/i })
    .or(page.locator("text=Ciente").first());
  if ((await ciente.count()) > 0) {
    await ciente.click({ timeout: 2000 }).catch(() => undefined);
    await sleep(300);
  }
}

/** Fecha modais "Aguarde..." e máscaras que bloqueiam o menu JSF. */
export async function dismissSigaaBlockingOverlays(page: Page): Promise<void> {
  const closeSelectors = [
    "#painel-mensagem-envio .close",
    "#painel-mensagem-envio_c .close",
    "button:has-text('Cancelar')",
  ];

  for (const selector of closeSelectors) {
    const locator = page.locator(selector).first();
    if ((await locator.count()) > 0) {
      await locator.click({ timeout: 1500 }).catch(() => undefined);
      await sleep(200);
    }
  }

  await page
    .waitForSelector("#painel-mensagem-envio_mask", {
      state: "hidden",
      timeout: 5000,
    })
    .catch(() => undefined);

  await page.evaluate(() => {
    for (const mask of document.querySelectorAll(".mask, .underlay")) {
      (mask as HTMLElement).style.display = "none";
    }
    for (const panel of document.querySelectorAll(
      "#painel-mensagem-envio_c, #painel-mensagem-envio"
    )) {
      panel.remove();
    }
  });
}

function htmlMatchesAny(html: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(html));
}

async function isSubpageVisible(page: Page, pattern: RegExp): Promise<boolean> {
  const playwrightLink = page.getByRole("link", { name: pattern });
  if ((await playwrightLink.count()) > 0) return true;

  return page.evaluate((patternSource) => {
    const pattern = new RegExp(patternSource, "i");
    return Array.from(document.querySelectorAll("a")).some((anchor) =>
      pattern.test((anchor.textContent ?? "").replace(/\s+/g, " ").trim())
    );
  }, pattern.source);
}

/**
 * Clica em item de menu JSF priorizando:
 * 1) Playwright getByRole("link")
 * 2) <a> com texto visível correspondente
 * 3) elemento com onclick explícito (células JSF)
 */
async function clickSigaaMenuItem(
  page: Page,
  patterns: RegExp | RegExp[]
): Promise<boolean> {
  const patternList = Array.isArray(patterns) ? patterns : [patterns];

  for (const pattern of patternList) {
    const playwrightLink = page.getByRole("link", { name: pattern });
    if ((await playwrightLink.count()) > 0) {
      await playwrightLink.first().click({ timeout: 5000 }).catch(() => undefined);
      return true;
    }

    const clicked = await page.evaluate((patternSource) => {
      const pattern = new RegExp(patternSource, "i");
      const normalize = (value: string) => value.replace(/\s+/g, " ").trim();

      const menuDiv = Array.from(document.querySelectorAll(".itemMenu")).find(
        (element) => pattern.test(normalize(element.textContent ?? ""))
      ) as HTMLElement | undefined;
      if (menuDiv) {
        const anchor = menuDiv.closest("a") as HTMLAnchorElement | null;
        if (anchor) {
          anchor.click();
          return true;
        }
        menuDiv.click();
        return true;
      }

      const anchors = Array.from(document.querySelectorAll("a")) as HTMLAnchorElement[];

      const exactAnchor = anchors.find((anchor) =>
        pattern.test(normalize(anchor.textContent ?? ""))
      );
      if (exactAnchor) {
        exactAnchor.click();
        return true;
      }

      const partialAnchor = anchors.find((anchor) => {
        const text = normalize(anchor.textContent ?? "");
        return text.length > 0 && pattern.test(text);
      });
      if (partialAnchor) {
        partialAnchor.click();
        return true;
      }

      const onclickElements = Array.from(
        document.querySelectorAll("[onclick]")
      ) as HTMLElement[];
      const onclickTarget = onclickElements.find((element) =>
        pattern.test(normalize(element.textContent ?? ""))
      );
      if (onclickTarget) {
        onclickTarget.click();
        return true;
      }

      return false;
    }, pattern.source);

    if (clicked) return true;
  }

  return false;
}

async function isAnySubpageVisible(
  page: Page,
  patterns: RegExp[]
): Promise<boolean> {
  for (const pattern of patterns) {
    if (await isSubpageVisible(page, pattern)) return true;
  }
  return false;
}

async function resolveSubpageHref(
  page: Page,
  patterns: RegExp[]
): Promise<string | null> {
  return page.evaluate((patternSources) => {
    const matchers = patternSources.map((source) => new RegExp(source, "i"));
    const normalize = (value: string) => value.replace(/\s+/g, " ").trim();

    for (const anchor of Array.from(document.querySelectorAll("a")) as HTMLAnchorElement[]) {
      const text = normalize(anchor.textContent ?? "");
      if (!text || !anchor.href || anchor.href.startsWith("javascript:")) continue;
      if (matchers.some((pattern) => pattern.test(text))) {
        return anchor.href;
      }
    }

    return null;
  }, patterns.map((pattern) => pattern.source));
}

async function expandParentMenuIfNeeded(
  page: Page,
  subpagePatterns: RegExp[],
  parentPattern?: RegExp
): Promise<void> {
  if (!parentPattern) return;
  if (await isAnySubpageVisible(page, subpagePatterns)) return;

  await clickSigaaMenuItem(page, parentPattern);
  await sleep(900);
}

async function waitForSubpageContent(
  page: Page,
  config: TurmaSubpageConfig,
  previousHtml: string,
  timeoutMs = 8000
): Promise<string | null> {
  const deadline = Date.now() + timeoutMs;
  let lastHtml: string | null = null;
  let lastUrl = "";

  while (Date.now() < deadline) {
    await page.waitForLoadState("domcontentloaded").catch(() => undefined);
    try {
      const html = await page.content();
      const url = page.url();
      lastHtml = html;
      lastUrl = url;

      const contentOk =
        html !== previousHtml && htmlMatchesAny(html, config.contentPatterns);
      const urlOk = config.urlPatterns.some((pattern) => pattern.test(url));

      if (contentOk || (urlOk && htmlMatchesAny(html, config.contentPatterns))) {
        if (!config.validateHtml || config.validateHtml(html)) {
          return html;
        }

        // Conteúdo/URL batem, mas o validator estrito falhou — ainda assim
        // devolve o HTML para o parser (ex.: mapa de frequência com layout novo).
        if (urlOk || /Mapa\s+de\s+Frequ|FrequenciaAluno/i.test(html)) {
          dumpScrapeHtml(
            "rejected-validate",
            `${config.key}-soft`,
            html
          );
          return html;
        }
      }
    } catch {
      // Ignorar "Unable to retrieve content because the page is navigating"
    }

    await sleep(350);
  }

  try {
    const html = lastHtml ?? (await page.content());
    if (htmlMatchesAny(html, config.contentPatterns)) {
      if (!config.validateHtml || config.validateHtml(html)) {
        return html;
      }
      if (
        config.urlPatterns.some((pattern) => pattern.test(lastUrl || page.url())) ||
        /Mapa\s+de\s+Frequ|FrequenciaAluno/i.test(html)
      ) {
        dumpScrapeHtml("rejected-validate", `${config.key}-timeout-soft`, html);
        return html;
      }
      dumpScrapeHtml("rejected-validate", `${config.key}-timeout`, html);
    }
  } catch {
    // ignorar
  }

  return null;
}

async function isInsideTurmaVirtual(page: Page): Promise<boolean> {
  if (/\/ava\//i.test(page.url())) return true;

  const html = await page.content();
  return /turma\s*virtual|ver\s*notas|frequ[eê]ncia|tarefas/i.test(html);
}

/* ---------- Portal: listar disciplinas ---------- */

export async function extractPortalDisciplinaLinks(
  page: Page
): Promise<TurmaVirtualIndexEntry[]> {
  // Sempre recarrega o portal — após histórico a URL ainda pode ser
  // *discente* sem o bloco form_acessarTurmaVirtual visível.
  await page.goto(SIGAA_PORTAL_DISCENTE_URL, {
    waitUntil: "domcontentloaded",
    timeout: SIGAA_NAVIGATION_TIMEOUT_MS,
  });
  await dismissSigaaCookieBanner(page);
  await dismissSigaaBlockingOverlays(page);
  await sleep(800);

  const entries = await page.evaluate(
    ({ patternSource, turmaHrefPatternSource }) => {
      const pattern = new RegExp(patternSource);
      const turmaHrefPattern = new RegExp(turmaHrefPatternSource, "i");
      const seen = new Set<string>();
      const entries: Array<{ sigaaNome: string; sigaaUrl: string }> = [];

      const consider = (anchor: HTMLAnchorElement) => {
        const nome = (anchor.textContent ?? "").replace(/\s+/g, " ").trim();
        const href = anchor.href || "";
        const onclick = anchor.getAttribute("onclick") ?? "";
        if (!nome || nome.length < 2) return;

        const isSemestreLink = pattern.test(nome);
        const isTurmaVirtualHref = turmaHrefPattern.test(href);
        const isTurmaVirtualOnclick =
          /frontEndIdTurma/i.test(onclick) ||
          /form_acessarTurmaVirtual/i.test(onclick);
        if (!isSemestreLink && !isTurmaVirtualHref && !isTurmaVirtualOnclick) {
          return;
        }
        if (seen.has(nome)) return;

        seen.add(nome);
        entries.push({ sigaaNome: nome, sigaaUrl: href });
      };

      for (const anchor of Array.from(document.querySelectorAll("a"))) {
        consider(anchor as HTMLAnchorElement);
      }

      return entries;
    },
    {
      patternSource: SEMESTRE_LINK_PATTERN.source,
      turmaHrefPatternSource: TURMA_VIRTUAL_HREF_PATTERN.source,
    }
  );

  console.info(
    `[scraper:turma] Links no portal: ${entries.length}` +
      (entries.length
        ? ` — ${entries.map((e) => e.sigaaNome).join(", ")}`
        : " (nenhum form_acessarTurmaVirtual/frontEndIdTurma)")
  );

  return entries;
}

function normalizeTurmaDisciplinaKey(nome: string): string {
  return stripSemestreSuffix(nome)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function inferSemestreAtualFromEntries(
  entries: TurmaVirtualIndexEntry[],
  fallback?: string | null
): string {
  for (const entry of entries) {
    const match = entry.sigaaNome.match(/\((\d{4}\.\d)\)\s*$/);
    if (match?.[1]) return match[1];
  }
  return fallback ?? new Date().getFullYear() + ".1";
}

/** Une links do portal com disciplinas do quadro de horários (evita perder turmas). */
export function mergeTurmaVirtualEntries(
  fromLinks: TurmaVirtualIndexEntry[],
  semestreDisciplinas: PortalDisciplinaSemestre[],
  semestreAtual: string
): TurmaVirtualIndexEntry[] {
  const byKey = new Map<string, TurmaVirtualIndexEntry>();

  for (const entry of fromLinks) {
    byKey.set(normalizeTurmaDisciplinaKey(entry.sigaaNome), entry);
  }

  for (const disciplina of semestreDisciplinas) {
    const nome = disciplina.nome.trim();
    if (!nome) continue;

    const key = normalizeTurmaDisciplinaKey(nome);
    if (byKey.has(key)) continue;

    byKey.set(key, {
      sigaaNome: buildDisciplinaPortalLabel(nome, semestreAtual),
      sigaaUrl: "",
    });
  }

  return Array.from(byKey.values());
}

/* ---------- Portal: entrar na disciplina ---------- */

function normalizeMatchKey(nome: string): string {
  return normalizeTurmaDisciplinaKey(nome);
}

async function clickTurmaVirtualByNome(
  page: Page,
  disciplinaLabel: string
): Promise<boolean> {
  const targetKey = normalizeMatchKey(disciplinaLabel);
  if (!targetKey) return false;

  return page.evaluate((key) => {
    const normalize = (value: string) =>
      value
        .replace(/\s*\(\d{4}\.\d\)\s*$/, "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^\w\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

    const anchors = Array.from(document.querySelectorAll("a"));
    const match = anchors.find((anchor) => {
      const onclick = anchor.getAttribute("onclick") ?? "";
      if (
        !/frontEndIdTurma/i.test(onclick) &&
        !/form_acessarTurmaVirtual/i.test(onclick)
      ) {
        return false;
      }
      const nome = (anchor.textContent ?? "").replace(/\s+/g, " ").trim();
      return normalize(nome) === key;
    });

    if (!match) return false;
    (match as HTMLAnchorElement).click();
    return true;
  }, targetKey);
}

async function enterDisciplinaFromPortal(
  page: Page,
  disciplinaLabel: string
): Promise<boolean> {
  await page.goto(SIGAA_PORTAL_DISCENTE_URL, {
    waitUntil: "domcontentloaded",
    timeout: SIGAA_NAVIGATION_TIMEOUT_MS,
  });
  await dismissSigaaCookieBanner(page);
  await dismissSigaaBlockingOverlays(page);
  await sleep(500);

  const urlBefore = page.url();

  // 1) Clique direto no form_acessarTurmaVirtual (nome sem sufixo 2026.2)
  let clicked = await clickTurmaVirtualByNome(page, disciplinaLabel);

  if (!clicked) {
    const exact = page.getByRole("link", { name: disciplinaLabel, exact: true });
    if ((await exact.count()) > 0) {
      await exact.click();
      clicked = true;
    } else {
      const baseName = disciplinaLabel.replace(/\s*\(\d{4}\.\d\)\s*$/, "").trim();
      const fuzzy = page.getByRole("link", {
        name: new RegExp(
          `^\\s*${baseName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`,
          "i"
        ),
      });
      if ((await fuzzy.count()) > 0) {
        await fuzzy.first().click();
        clicked = true;
      }
    }
  }

  if (!clicked) {
    console.warn(
      `[scraper:turma] Link não encontrado no portal para "${disciplinaLabel}"`
    );
    return false;
  }

  await sleep(2500);
  await page.waitForLoadState("domcontentloaded").catch(() => undefined);

  if (await isInsideTurmaVirtual(page)) return true;

  // JSF às vezes exige segundo clique — só se ainda estiver no portal
  if (page.url() === urlBefore || page.url().includes("discente.jsf")) {
    await clickTurmaVirtualByNome(page, disciplinaLabel);
    await sleep(2500);
    await page.waitForLoadState("domcontentloaded").catch(() => undefined);
  }

  return isInsideTurmaVirtual(page);
}

/* ---------- Turma virtual: navegar entre seções ---------- */

async function navigateToSubpage(
  page: Page,
  config: TurmaSubpageConfig,
  disciplinaLabel: string
): Promise<string | null> {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    if (attempt > 0) {
      await returnToTurmaMenu(page);
    }

    const previousHtml = await page.content();

    await expandParentMenuIfNeeded(
      page,
      config.menuPatterns,
      config.expandMenuPattern
    );

    const clicked = await clickSigaaMenuItem(page, config.menuPatterns);
    if (clicked) {
      const clickHtml = await waitForSubpageContent(
        page,
        config,
        previousHtml,
        config.waitTimeoutMs ?? 7000
      );
      if (clickHtml) {
        dumpScrapeHtml(disciplinaLabel, config.key, clickHtml);
        return clickHtml;
      }
    }

    const subpageHref = await resolveSubpageHref(page, config.menuPatterns);
    if (subpageHref) {
      await page
        .goto(subpageHref, {
          waitUntil: "domcontentloaded",
          timeout: SIGAA_NAVIGATION_TIMEOUT_MS,
        })
        .catch(() => undefined);
      await sleep(1200);

      const hrefHtml = await waitForSubpageContent(
        page,
        config,
        previousHtml,
        config.waitTimeoutMs ?? 7000
      );
      if (hrefHtml) {
        dumpScrapeHtml(disciplinaLabel, config.key, hrefHtml);
        return hrefHtml;
      }
    }

    if (!clicked && !subpageHref) {
      console.warn(
        `[scraper:turma] "${disciplinaLabel}" — link "${config.key}" não encontrado (tentativa ${attempt + 1})`
      );
    } else {
      console.warn(
        `[scraper:turma] "${disciplinaLabel}" — "${config.key}" sem conteúdo válido (tentativa ${attempt + 1})`
      );
    }

    await sleep(600);
  }

  console.warn(
    `[scraper:turma] "${disciplinaLabel}" — falha ao carregar "${config.key}"`
  );
  try {
    dumpScrapeHtml(disciplinaLabel, `${config.key}-failed`, await page.content());
  } catch {
    // ignorar
  }
  return null;
}

async function returnToTurmaMenu(page: Page): Promise<void> {
  const clicked = await clickSigaaMenuItem(page, /^turma\s*virtual$/i);
  if (clicked) {
    await sleep(1200);
    await page.waitForLoadState("domcontentloaded").catch(() => undefined);
    return;
  }

  await page.goBack({ waitUntil: "domcontentloaded" }).catch(() => undefined);
  await sleep(1000);
}

/* ---------- Orquestração ---------- */

export interface DisciplinaPagesHtml {
  notasHtml: string | null;
  frequenciaHtml: string | null;
  grupoHtml: string | null;
  tarefasHtml: string | null;
  tarefaDetalhesHtml: Record<string, string>;
}

export async function scrapeDisciplinaPages(
  page: Page,
  disciplinaLabel: string,
  options?: { subpageKeys?: string[] }
): Promise<DisciplinaPagesHtml | null> {
  const entered = await enterDisciplinaFromPortal(page, disciplinaLabel);
  if (!entered) {
    console.warn(`[scraper:turma] Não entrou em "${disciplinaLabel}"`);
    return null;
  }

  const allowed = options?.subpageKeys
    ? new Set(options.subpageKeys)
    : null;

  const results: DisciplinaPagesHtml = {
    notasHtml: null,
    frequenciaHtml: null,
    grupoHtml: null,
    tarefasHtml: null,
    tarefaDetalhesHtml: {},
  };

  for (const config of TURMA_SUBPAGES) {
    if (allowed && !allowed.has(config.key)) {
      continue;
    }

    const html = await navigateToSubpage(page, config, disciplinaLabel);

    if (config.key === "notas") results.notasHtml = html;
    if (config.key === "frequencia") results.frequenciaHtml = html;
    if (config.key === "grupo") results.grupoHtml = html;

    await returnToTurmaMenu(page);
  }

  const captured = [
    results.notasHtml ? "notas" : null,
    results.frequenciaHtml ? "freq" : null,
    results.grupoHtml ? "grupo" : null,
  ]
    .filter(Boolean)
    .join(", ");

  console.info(
    `[scraper:turma] "${disciplinaLabel}" — capturado: ${captured || "nada"}`
  );

  return results;
}

export async function returnToPortal(page: Page): Promise<void> {
  await page.goto(SIGAA_PORTAL_DISCENTE_URL, {
    waitUntil: "domcontentloaded",
    timeout: SIGAA_NAVIGATION_TIMEOUT_MS,
  });
  await dismissSigaaCookieBanner(page);
  await sleep(500);
}

export function buildDisciplinaPortalLabel(
  nome: string,
  semestreAtual = "2026.1"
): string {
  if (SEMESTRE_LINK_PATTERN.test(nome.trim())) return nome.trim();
  return `${nome.trim()} (${semestreAtual})`;
}

export function stripSemestreSuffix(nome: string): string {
  return nome.replace(/\s*\(\d{4}\.\d\)\s*$/, "").trim();
}
