import {
  SIGAA_NAVIGATION_TIMEOUT_MS,
  SIGAA_SCRAPER_MOCK,
  SIGAA_TURMA_SCRAPE_DELAY_MS,
} from "@/lib/scraper/constants";
import { ScraperError, mapUnknownScraperError } from "@/lib/scraper/errors";
import { buildMockTurmaVirtualSnapshot } from "@/lib/scraper/turma-virtual/mock-turma-snapshot";
import {
  assertTurmaVirtualSnapshot,
  parseTurmaDisciplinaPages,
} from "@/lib/scraper/turma-virtual/parse-turma-disciplina";
import {
  capturePortalTurmaSubpageHtml,
  extractPortalDisciplinaLinks,
} from "@/lib/scraper/turma-virtual/portal-turma-navigation";
import { sleep } from "@/lib/scraper/turma-virtual/html-utils";
import { withAuthenticatedPage } from "@/lib/scraper/session-context";
import type { SigaaSession } from "@/lib/scraper/types";
import type {
  TurmaVirtualDisciplinaRawPages,
  TurmaVirtualDisciplinaSnapshot,
  TurmaVirtualSnapshot,
} from "@/lib/scraper/types/turma-virtual";

async function scrapeDisciplinaFromPortal(
  page: import("playwright").Page,
  disciplinaLabel: string
): Promise<TurmaVirtualDisciplinaSnapshot> {
  const notasHtml = await capturePortalTurmaSubpageHtml(
    page,
    disciplinaLabel,
    /^ver\s*notas$/i,
    { expectedUrlPattern: /\/ava\/index\.jsf/i }
  );

  const frequenciaHtml = await capturePortalTurmaSubpageHtml(
    page,
    disciplinaLabel,
    /^frequência$/i,
    { expectedUrlPattern: /\/ava\/FrequenciaAluno\//i }
  );

  const grupoHtml = await capturePortalTurmaSubpageHtml(
    page,
    disciplinaLabel,
    /^ver\s*grupo$/i,
    { expectedUrlPattern: /\/ava\/GrupoDiscentes\//i }
  );

  const tarefasHtml = await capturePortalTurmaSubpageHtml(
    page,
    disciplinaLabel,
    /^tarefas$/i,
    { expectedUrlPattern: /\/ava\/TarefaTurma\//i }
  );

  const raw: TurmaVirtualDisciplinaRawPages = {
    sigaaNome: disciplinaLabel,
    sigaaUrl: null,
    notasHtml,
    frequenciaHtml,
    grupoHtml,
    tarefasHtml,
    tarefaDetalhesHtml: {},
  };

  return parseTurmaDisciplinaPages(raw);
}

async function scrapeLiveTurmaVirtual(
  session: SigaaSession
): Promise<TurmaVirtualSnapshot> {
  return withAuthenticatedPage(session, async (page) => {
    let entries;

    try {
      entries = await extractPortalDisciplinaLinks(page);
    } catch (error) {
      throw mapUnknownScraperError(error);
    }

    if (page.url().includes("verTelaLogin")) {
      throw ScraperError.authFailed("Sessão expirada ao acessar o portal do discente.");
    }

    const disciplinas: TurmaVirtualDisciplinaSnapshot[] = [];

    for (const entry of entries) {
      try {
        disciplinas.push(await scrapeDisciplinaFromPortal(page, entry.sigaaNome));
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Falha ao raspar disciplina.";
        disciplinas.push({
          sigaaNome: entry.sigaaNome,
          sigaaUrl: entry.sigaaUrl,
          professor: null,
          maxFaltas: null,
          notas: [],
          faltas: [],
          grupo: [],
          tarefas: [],
          scrapeWarnings: [message],
        });
      }

      await sleep(SIGAA_TURMA_SCRAPE_DELAY_MS);
    }

    const snapshot: TurmaVirtualSnapshot = {
      scrapedAt: new Date().toISOString(),
      disciplinas,
    };

    try {
      assertTurmaVirtualSnapshot(snapshot);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Turma virtual vazia.";
      throw ScraperError.scrapeFailed(message);
    }

    return snapshot;
  });
}

export async function scrapeTurmaVirtual(
  session: SigaaSession
): Promise<TurmaVirtualSnapshot> {
  if (SIGAA_SCRAPER_MOCK) {
    if (session.username.toLowerCase() === "offline") {
      throw ScraperError.offline();
    }
    return buildMockTurmaVirtualSnapshot();
  }

  try {
    return await scrapeLiveTurmaVirtual(session);
  } catch (error) {
    if (error instanceof ScraperError) {
      throw error;
    }
    throw mapUnknownScraperError(error);
  }
}
