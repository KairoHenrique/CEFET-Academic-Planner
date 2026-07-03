import type { Page } from "playwright";
import { isPortalDiscenteHomeHtml } from "@/lib/scraper/calendario/calendario-event-filter";
import { SIGAA_NAVIGATION_TIMEOUT_MS } from "@/lib/scraper/constants";
import { sleep } from "@/lib/scraper/turma-virtual/html-utils";

function buildSemestreSectionPattern(semestre: string): RegExp {
  const [year, period] = semestre.split(".");
  if (!year || !period) return /$^/;

  return new RegExp(
    `Calend[aá]rio\\s+${year}[./\\s-]*${period}|${year}\\s*[/.\\-]\\s*${period}|${year}\\.${period}`,
    "i"
  );
}

export async function isCalendarioDetailPage(page: Page): Promise<boolean> {
  const html = await page.content().catch(() => "");
  if (isPortalDiscenteHomeHtml(html)) return false;

  if (
    /Visualiza[cç][aã]o do Calend[aá]rio Acad[eê]mico|DADOS DO CALEND[AÁ]RIO ACAD[EÊ]MICO/i.test(
      html
    )
  ) {
    return true;
  }

  return page.evaluate(() => {
    const body = document.body?.innerText ?? "";
    if (/Turmas do Semestre|Componente Curricular/i.test(body)) return false;
    if (/Lista de Calend[aá]rios|CALEND[AÁ]RIO\s+GERAL/i.test(body)) return false;

    return (
      /Visualiza[cç][aã]o do Calend[aá]rio/i.test(body) ||
      (/Per[ií]odo\s+Letivo/i.test(body) &&
        /De\s+\d{1,2}\/\d{1,2}\/\d{4}/i.test(body))
    );
  });
}

export async function isCalendarioListPage(page: Page): Promise<boolean> {
  if (await isCalendarioDetailPage(page)) return false;

  const html = await page.content().catch(() => "");
  if (isPortalDiscenteHomeHtml(html)) return false;

  return page.evaluate(() => {
    const body = document.body?.innerText ?? "";
    if (/Turmas do Semestre|Componente Curricular/i.test(body)) return false;
    if (/Visualiza[cç][aã]o do Calend[aá]rio/i.test(body)) return false;

    return (
      (/Lista de Calend[aá]rios|Consulta de Calend[aá]rio Acad[eê]mico/i.test(
        body
      ) &&
        /CALEND[AÁ]RIO\s+GERAL/i.test(body)) ||
      (/CALEND[AÁ]RIO\s+GERAL/i.test(body) &&
        /Calend[aá]rio\s+20\d{2}/i.test(body))
    );
  });
}

export async function waitForCalendarioListPage(page: Page): Promise<boolean> {
  try {
    await page.waitForFunction(
      () => {
        const body = document.body?.innerText ?? "";
        if (/Turmas do Semestre|Componente Curricular/i.test(body)) return false;
        if (/Visualiza[cç][aã]o do Calend[aá]rio/i.test(body)) return false;
        return (
          /Lista de Calend[aá]rios|Consulta de Calend[aá]rio Acad[eê]mico/i.test(
            body
          ) && /CALEND[AÁ]RIO\s+GERAL/i.test(body)
        );
      },
      { timeout: SIGAA_NAVIGATION_TIMEOUT_MS }
    );
    return true;
  } catch {
    return isCalendarioListPage(page);
  }
}

async function waitForCalendarioDetailPage(page: Page): Promise<boolean> {
  const deadline = Date.now() + SIGAA_NAVIGATION_TIMEOUT_MS;
  while (Date.now() < deadline) {
    await sleep(400);
    if (await isCalendarioDetailPage(page)) return true;
  }
  return isCalendarioDetailPage(page);
}

/**
 * Na lista SIGAA, cada semestre tem um bloco "Calendário YYYY.N" + linha
 * "CALENDÁRIO GERAL" com ícone de lupa (visualizar).
 */
export async function openCalendarioDetailForSemester(
  page: Page,
  semestresAlvo: string[]
): Promise<boolean> {
  if (await isCalendarioDetailPage(page)) return true;
  if (!(await isCalendarioListPage(page))) return false;

  for (const semestre of semestresAlvo) {
    const sectionPattern = buildSemestreSectionPattern(semestre);

    const clicked = await page.evaluate((patternSource) => {
      const normalize = (text: string) => text.replace(/\s+/g, " ").trim();
      const sectionPattern = new RegExp(patternSource, "i");
      const rows = Array.from(
        document.querySelectorAll(
          "table.listagem tr, table.tabela tr, table tr"
        )
      );

      const sectionIdx = rows.findIndex((row) =>
        sectionPattern.test(normalize(row.textContent ?? ""))
      );
      if (sectionIdx < 0) return false;

      for (let index = sectionIdx + 1; index < rows.length; index += 1) {
        const rowText = normalize(rows[index].textContent ?? "");

        if (/Calend[aá]rio\s+20\d{2}/i.test(rowText) && index > sectionIdx + 1) {
          break;
        }

        if (!/CALEND[AÁ]RIO\s+GERAL/i.test(rowText)) continue;

        const links = Array.from(rows[index].querySelectorAll("a"));
        const visualLink =
          links.find((link) =>
            /visual|detalh|consult/i.test(link.title ?? link.getAttribute("title") ?? "")
          ) ??
          links.find((link) => {
            const img = link.querySelector("img");
            const src = img?.getAttribute("src") ?? "";
            const alt = img?.getAttribute("alt") ?? "";
            return /visual|lupa|detalh|consult/i.test(`${src} ${alt}`);
          }) ??
          links.at(-1);

        if (!visualLink) continue;

        visualLink.click();
        return true;
      }

      return false;
    }, sectionPattern.source);

    if (!clicked) {
      console.warn(
        `[scraper:calendario] Lupa não encontrada para semestre ${semestre}.`
      );
      continue;
    }

    if (await waitForCalendarioDetailPage(page)) return true;
  }

  return false;
}
