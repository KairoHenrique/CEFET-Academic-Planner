import type { Page } from "playwright";
import { SIGAA_NAVIGATION_TIMEOUT_MS, SIGAA_PORTAL_DISCENTE_URL } from "@/lib/scraper/constants";
import { sleep } from "@/lib/scraper/turma-virtual/html-utils";
import type { TurmaVirtualIndexEntry } from "@/lib/scraper/types/turma-virtual";

const SEMESTRE_LINK_PATTERN = /\(\d{4}\.\d\)$/;

export async function dismissSigaaCookieBanner(page: Page): Promise<void> {
  const ciente = page.getByRole("button", { name: /ciente/i }).or(
    page.locator("text=Ciente").first()
  );
  if ((await ciente.count()) > 0) {
    await ciente.click({ timeout: 2000 }).catch(() => undefined);
    await sleep(300);
  }
}

export async function extractPortalDisciplinaLinks(
  page: Page
): Promise<TurmaVirtualIndexEntry[]> {
  await page.goto(SIGAA_PORTAL_DISCENTE_URL, {
    waitUntil: "domcontentloaded",
    timeout: SIGAA_NAVIGATION_TIMEOUT_MS,
  });
  await dismissSigaaCookieBanner(page);

  return page.evaluate((patternSource) => {
    const pattern = new RegExp(patternSource);
    const seen = new Set<string>();
    const entries: Array<{ sigaaNome: string; sigaaUrl: string }> = [];

    for (const anchor of Array.from(document.querySelectorAll("a"))) {
      const nome = anchor.textContent?.replace(/\s+/g, " ").trim() ?? "";
      if (!nome || !pattern.test(nome)) continue;
      if (seen.has(nome)) continue;
      seen.add(nome);
      entries.push({ sigaaNome: nome, sigaaUrl: anchor.href || "" });
    }

    return entries;
  }, SEMESTRE_LINK_PATTERN.source);
}

export async function jsClickMenuLink(
  page: Page,
  labelPattern: RegExp
): Promise<boolean> {
  return page.evaluate((patternSource) => {
    const pattern = new RegExp(patternSource, "i");
    const anchor = Array.from(document.querySelectorAll("a")).find((link) =>
      pattern.test((link.textContent ?? "").trim())
    ) as HTMLAnchorElement | undefined;
    if (!anchor) return false;
    anchor.click();
    return true;
  }, labelPattern.source);
}

export async function openPortalDisciplinaMenu(
  page: Page,
  disciplinaLabel: string
): Promise<boolean> {
  await page.goto(SIGAA_PORTAL_DISCENTE_URL, {
    waitUntil: "domcontentloaded",
    timeout: SIGAA_NAVIGATION_TIMEOUT_MS,
  });
  await dismissSigaaCookieBanner(page);

  const exact = page.getByRole("link", { name: disciplinaLabel, exact: true });
  if ((await exact.count()) > 0) {
    await exact.click();
    await page.waitForLoadState("domcontentloaded");
    await sleep(1200);
    return true;
  }

  const baseName = disciplinaLabel.replace(/\s*\(\d{4}\.\d\)\s*$/, "").trim();
  const fuzzy = page.getByRole("link", {
    name: new RegExp(baseName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"),
  });
  if ((await fuzzy.count()) === 0) return false;

  await fuzzy.first().click();
  await page.waitForLoadState("domcontentloaded");
  await sleep(1200);
  return true;
}

function hasReachedTurmaSubpage(
  currentUrl: string,
  portalUrl: string,
  expectedUrlPattern?: RegExp
): boolean {
  if (expectedUrlPattern?.test(currentUrl)) return true;
  return currentUrl !== portalUrl && /\/ava\//i.test(currentUrl);
}

/** CEFET: menu JSF — alguns itens (ex.: Ver Notas) navegam no 1º clique; outros exigem 2. */
export async function capturePortalTurmaSubpageHtml(
  page: Page,
  disciplinaLabel: string,
  menuPattern: RegExp,
  options?: { expectedUrlPattern?: RegExp }
): Promise<string | null> {
  const opened = await openPortalDisciplinaMenu(page, disciplinaLabel);
  if (!opened) return null;

  const portalUrl = page.url();

  const first = await jsClickMenuLink(page, menuPattern);
  if (!first) return null;
  await sleep(2000);
  await page.waitForLoadState("domcontentloaded").catch(() => undefined);

  if (hasReachedTurmaSubpage(page.url(), portalUrl, options?.expectedUrlPattern)) {
    await sleep(1500);
    return page.content();
  }

  const second = await jsClickMenuLink(page, menuPattern);
  await sleep(second ? 3500 : 1500);
  await page.waitForLoadState("domcontentloaded").catch(() => undefined);

  if (hasReachedTurmaSubpage(page.url(), portalUrl, options?.expectedUrlPattern)) {
    return page.content();
  }

  return null;
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
