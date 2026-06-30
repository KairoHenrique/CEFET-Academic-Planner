import type { Page } from "playwright";
import {
  SIGAA_SCRAPER_MOCK,
  SIGAA_TURMA_SCRAPE_DELAY_MS,
} from "@/lib/scraper/constants";
import { ScraperError, mapUnknownScraperError } from "@/lib/scraper/errors";
import { buildMockTurmaVirtualSnapshot } from "@/lib/scraper/turma-virtual/mock-turma-snapshot";
import {
  assertTurmaVirtualSnapshot,
  parseTurmaDisciplinaPages,
} from "@/lib/scraper/turma-virtual/parse-turma-disciplina";
import type { PortalDisciplinaSemestre } from "@/lib/scraper/types/portal-discente";
import {
  extractPortalDisciplinaLinks,
  inferSemestreAtualFromEntries,
  mergeTurmaVirtualEntries,
  returnToPortal,
  scrapeDisciplinaPages,
} from "@/lib/scraper/turma-virtual/portal-turma-navigation";
import { sleep } from "@/lib/scraper/turma-virtual/html-utils";
import type {
  TurmaVirtualDisciplinaRawPages,
  TurmaVirtualDisciplinaSnapshot,
  TurmaVirtualSnapshot,
} from "@/lib/scraper/types/turma-virtual";

/**
 * Raspa a turma virtual de todas as disciplinas do semestre.
 * Recebe uma page já logada no SIGAA (mesma sessão do portal).
 */
export interface ScrapeTurmaVirtualOptions {
  semestreDisciplinas?: PortalDisciplinaSemestre[];
  semestreLetivo?: string | null;
  matricula?: string | null;
}

export async function scrapeTurmaVirtual(
  page: Page,
  options: ScrapeTurmaVirtualOptions = {}
): Promise<TurmaVirtualSnapshot> {
  let linkEntries: Awaited<ReturnType<typeof extractPortalDisciplinaLinks>>;

  try {
    linkEntries = await extractPortalDisciplinaLinks(page);
  } catch (error) {
    throw mapUnknownScraperError(error);
  }

  if (page.url().includes("verTelaLogin")) {
    throw ScraperError.authFailed("Sessão expirada ao acessar o portal do discente.");
  }

  const semestreAtual = inferSemestreAtualFromEntries(
    linkEntries,
    options.semestreLetivo
  );
  const entries = mergeTurmaVirtualEntries(
    linkEntries,
    options.semestreDisciplinas ?? [],
    semestreAtual
  );

  if (linkEntries.length > 0 || (options.semestreDisciplinas?.length ?? 0) > 0) {
    const fromSemestre = entries.length - linkEntries.length;
    console.info(
      `[scraper:turma] Fila: ${entries.length} disciplina(s) (${linkEntries.length} link(s) no portal` +
        (fromSemestre > 0 ? ` + ${fromSemestre} do quadro de horários` : "") +
        ")"
    );
  }

  if (entries.length === 0) {
    console.warn("[scraper:turma] Nenhuma disciplina encontrada no portal.");
    return {
      scrapedAt: new Date().toISOString(),
      disciplinas: [],
    };
  }

  const disciplinas: TurmaVirtualDisciplinaSnapshot[] = [];

  for (const entry of entries) {
    try {
      const pagesHtml = await scrapeDisciplinaPages(page, entry.sigaaNome);

      if (!pagesHtml) {
        disciplinas.push(buildEmptyDisciplina(entry, "Não foi possível entrar na disciplina."));
        continue;
      }

      const raw: TurmaVirtualDisciplinaRawPages = {
        sigaaNome: entry.sigaaNome,
        sigaaUrl: entry.sigaaUrl || null,
        matricula: options.matricula ?? null,
        notasHtml: pagesHtml.notasHtml,
        frequenciaHtml: pagesHtml.frequenciaHtml,
        grupoHtml: pagesHtml.grupoHtml,
        tarefasHtml: pagesHtml.tarefasHtml,
        tarefaDetalhesHtml: pagesHtml.tarefaDetalhesHtml,
      };

      disciplinas.push(parseTurmaDisciplinaPages(raw));

      const last = disciplinas[disciplinas.length - 1];
      if (last) {
        if (last.notas.length > 0) {
          const launched = last.notas.filter((n) => n.notaObtida !== null).length;
          console.info(
            `[scraper:turma] "${entry.sigaaNome}" — ${launched}/${last.notas.length} notas lançadas`
          );
        }
        const empty =
          last.notas.length === 0 &&
          last.faltas.length === 0 &&
          last.tarefas.length === 0;
        if (empty) {
          console.warn(
            `[scraper:turma] "${entry.sigaaNome}" — parsers retornaram vazio (HTML pode estar incorreto)`
          );
        }
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Falha ao raspar disciplina.";
      console.warn(`[scraper:turma] Erro em "${entry.sigaaNome}": ${message}`);
      disciplinas.push(buildEmptyDisciplina(entry, message));
    }

    // Voltar ao portal para a próxima disciplina
    await returnToPortal(page);
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
    console.warn(`[scraper:turma] ${message}`);
    // Não throw — retorna snapshot parcial
  }

  return snapshot;
}

function buildEmptyDisciplina(
  entry: { sigaaNome: string; sigaaUrl?: string },
  warning: string
): TurmaVirtualDisciplinaSnapshot {
  return {
    sigaaNome: entry.sigaaNome,
    sigaaUrl: entry.sigaaUrl || null,
    professor: null,
    maxFaltas: null,
    notas: [],
    faltas: [],
    grupo: [],
    grupoNome: null,
    tarefas: [],
    scrapeWarnings: [warning],
  };
}

/**
 * Wrapper mock — chamado pelo runSync quando SIGAA_SCRAPER_MOCK=true.
 */
export function scrapeTurmaVirtualMock(): TurmaVirtualSnapshot {
  return buildMockTurmaVirtualSnapshot();
}
