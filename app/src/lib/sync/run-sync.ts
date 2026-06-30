import {
  clearSigaaCredentials,
  persistSigaaCredentials,
} from "@/lib/crypto/sigaa-credential-store";
import { internalError } from "@/lib/api/errors";
import { ScraperError, mapUnknownScraperError } from "@/lib/scraper/errors";
import { SIGAA_SCRAPER_MOCK } from "@/lib/scraper/constants";
import { createMockSession, loginSigaaOnPage } from "@/lib/scraper/auth";
import { withSyncBrowser } from "@/lib/scraper/session-context";
import { scrapePortalDiscente, scrapePortalDiscenteMock } from "@/lib/scraper/portal-discente/scrape-portal-discente";
import { scrapeTurmaVirtual, scrapeTurmaVirtualMock } from "@/lib/scraper/turma-virtual/scrape-turma-virtual";
import { scrapeHistorico, scrapeHistoricoMock } from "@/lib/scraper/historico/scrape-historico";
import { persistPortalSnapshot } from "@/lib/sync/persist-portal-snapshot";
import { persistTurmaVirtualSnapshot } from "@/lib/sync/persist-turma-virtual-snapshot";
import { persistHistoricoSnapshot } from "@/lib/sync/persist-historico-snapshot";
import { pruneInvalidSyncedTarefas, pruneOrphanSyncedTarefas } from "@/lib/db/queries";
import { resolveSyncCredentials, type ResolvedSyncCredentials } from "@/lib/sync/resolve-credentials";
import type { SigaaSession } from "@/lib/scraper/types";
import type { SyncRequest, SyncStep } from "@/lib/types/sync";

export interface SyncResult {
  steps: SyncStep[];
  session: SigaaSession;
}

function persistCredentialsPreference(
  credentials: ResolvedSyncCredentials
): void {
  if (credentials.savePassword) {
    persistSigaaCredentials(credentials.username, credentials.password);
    return;
  }
  clearSigaaCredentials();
}

/**
 * Executa o sync usando mock data (útil para desenvolvimento de UI offline).
 */
async function runMockSync(credentials: ResolvedSyncCredentials): Promise<SyncResult> {
  const steps: SyncStep[] = [
    { label: "Autenticando no SIGAA (Mock)…", progress: 15 },
  ];
  
  const session = createMockSession(credentials);
  persistCredentialsPreference(credentials);

  steps.push({ label: "Carregando portal do discente…", progress: 35 });
  const portalSnapshot = scrapePortalDiscenteMock(credentials.username);
  persistPortalSnapshot(portalSnapshot);

  steps.push({ label: "Sincronizando turma virtual…", progress: 60 });
  const turmaSnapshot = scrapeTurmaVirtualMock();
  persistTurmaVirtualSnapshot(turmaSnapshot);
  pruneInvalidSyncedTarefas();
  pruneOrphanSyncedTarefas();

  steps.push({ label: "Baixando histórico escolar…", progress: 90 });
  const historicoSnapshot = scrapeHistoricoMock();
  persistHistoricoSnapshot(historicoSnapshot);

  steps.push({ label: "Concluído", progress: 100 });

  return { steps, session };
}

/**
 * Executa o sync real, usando um ÚNICO browser e mantendo a sessão JSF.
 */
async function runLiveSync(credentials: ResolvedSyncCredentials): Promise<SyncResult> {
  return withSyncBrowser(async (page) => {
    const steps: SyncStep[] = [
      { label: "Autenticando no SIGAA…", progress: 15 },
    ];

    try {
      // 1. Login
      await loginSigaaOnPage(page, credentials);
      persistCredentialsPreference(credentials);
      const session: SigaaSession = {
        username: credentials.username,
        cookies: await page.context().cookies(),
        loggedInAt: new Date().toISOString(),
      };

      // 2. Portal
      steps.push({ label: "Carregando portal do discente…", progress: 30 });
      const portalSnapshot = await scrapePortalDiscente(page);
      try {
        persistPortalSnapshot(portalSnapshot);
      } catch (e) {
        throw internalError("Falha ao salvar dados do portal.");
      }

      // 3. Histórico — logo após portal (PDF baixa no clique do menu; antes da turma virtual)
      steps.push({ label: "Baixando histórico escolar…", progress: 50 });
      try {
        const historicoSnapshot = await scrapeHistorico(page, {
          skipPortalGoto: true,
        });
        const historicoResult = persistHistoricoSnapshot(historicoSnapshot);
        if (!historicoResult.persisted) {
          console.warn(
            `[sync] Histórico não persistido: ${historicoResult.reason ?? "sem dados"}`
          );
          steps.push({
            label: "Histórico escolar indisponível (portal/turma preservados)",
            progress: 55,
          });
        } else {
          console.info(
            `[sync] Histórico persistido: ${historicoResult.rowsWritten} disciplina(s).`
          );
        }
      } catch (error) {
        console.warn(
          "[sync] Falha na etapa de histórico escolar; dados anteriores preservados.",
          error instanceof Error ? error.message : error
        );
      }

      // 4. Turma Virtual
      steps.push({ label: "Sincronizando turma virtual…", progress: 70 });
      const turmaSnapshot = await scrapeTurmaVirtual(page, {
        semestreDisciplinas: portalSnapshot.semestreAtual,
        semestreLetivo: portalSnapshot.semestreLetivo,
        matricula: portalSnapshot.aluno.matricula,
      });
      try {
        persistTurmaVirtualSnapshot(turmaSnapshot);
        pruneInvalidSyncedTarefas();
        pruneOrphanSyncedTarefas();
      } catch (e) {
        throw internalError("Falha ao salvar dados da turma virtual.");
      }

      steps.push({ label: "Concluído", progress: 100 });
      return { steps, session };

    } catch (error) {
      if (error instanceof ScraperError) {
        throw error.toApiError();
      }
      throw mapUnknownScraperError(error).toApiError();
    }
  });
}

export async function runSync(input: SyncRequest): Promise<SyncResult> {
  const credentials = resolveSyncCredentials(input);

  console.info(
    `[sync] modo=${SIGAA_SCRAPER_MOCK ? "MOCK (dados fake)" : "LIVE (Playwright/SIGAA)"} user=${credentials.username}`
  );

  if (SIGAA_SCRAPER_MOCK) {
    return runMockSync(credentials);
  }

  return runLiveSync(credentials);
}
