import type { Page } from "playwright";
import { internalError } from "@/lib/api/errors";
import { ScraperError, mapUnknownScraperError } from "@/lib/scraper/errors";
import { scrapePortalDiscente } from "@/lib/scraper/portal-discente/scrape-portal-discente";
import { scrapeTurmaVirtual } from "@/lib/scraper/turma-virtual/scrape-turma-virtual";
import { scrapeHistorico } from "@/lib/scraper/historico/scrape-historico";
import type { PortalDiscenteSnapshot } from "@/lib/scraper/types/portal-discente";
import { pruneInvalidSyncedTarefas, pruneOrphanSyncedTarefas } from "@/lib/db/queries";
import { persistPortalSnapshot } from "@/lib/sync/persist-portal-snapshot";
import { persistTurmaVirtualSnapshot } from "@/lib/sync/persist-turma-virtual-snapshot";
import { persistHistoricoSnapshot } from "@/lib/sync/persist-historico-snapshot";
import { shouldRunHistoricoStage } from "@/lib/sync/sync-stage-plan";
import { normalizeSyncMode } from "@/lib/sync-policy/resolve-sync-mode";
import { recordHistoricoSyncedAt } from "@/lib/sync/sync-preferences";
import type { SyncMode, SyncPipelineResult, SyncStageResult } from "@/lib/types/sync-pipeline";
import type { SyncStep } from "@/lib/types/sync";

function pushStage(
  stages: SyncStageResult[],
  stage: SyncStageResult["stage"],
  outcome: SyncStageResult["outcome"],
  message?: string
): void {
  stages.push({ stage, outcome, message });
}

function appendWarningStep(
  steps: SyncStep[],
  label: string,
  progress: number
): void {
  steps.push({ label, progress });
}

async function runPortalStage(
  page: Page,
  steps: SyncStep[],
  stages: SyncStageResult[]
): Promise<PortalDiscenteSnapshot | null> {
  steps.push({ label: "Carregando portal do discente…", progress: 30 });

  try {
    const portalSnapshot = await scrapePortalDiscente(page);
    const portalResult = await persistPortalSnapshot(portalSnapshot);

    if (!portalResult.persisted) {
      pushStage(stages, "portal", "warning", portalResult.reason);
      appendWarningStep(
        steps,
        "Portal indisponível (dados anteriores preservados)",
        35
      );
      return null;
    }

    pushStage(stages, "portal", "ok");
    return portalSnapshot;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Falha ao raspar portal.";
    console.warn("[sync] Falha na etapa portal:", message);
    pushStage(stages, "portal", "warning", message);
    appendWarningStep(
      steps,
      "Portal indisponível (dados anteriores preservados)",
      35
    );
    return null;
  }
}

async function runHistoricoStage(
  page: Page,
  steps: SyncStep[],
  stages: SyncStageResult[]
): Promise<void> {
  steps.push({ label: "Baixando histórico escolar…", progress: 50 });

  try {
    const historicoSnapshot = await scrapeHistorico(page, {
      skipPortalGoto: true,
    });
    const historicoResult = persistHistoricoSnapshot(historicoSnapshot);

    if (!historicoResult.persisted) {
      pushStage(stages, "historico", "warning", historicoResult.reason);
      appendWarningStep(
        steps,
        "Histórico escolar indisponível (dados anteriores preservados)",
        55
      );
      return;
    }

    recordHistoricoSyncedAt();
    pushStage(stages, "historico", "ok");
    console.info(
      `[sync] Histórico persistido: ${historicoResult.rowsWritten} disciplina(s).`
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Falha no histórico escolar.";
    console.warn("[sync] Falha na etapa de histórico escolar:", message);
    pushStage(stages, "historico", "warning", message);
    appendWarningStep(
      steps,
      "Histórico escolar indisponível (dados anteriores preservados)",
      55
    );
  }
}

async function runTurmaStage(
  page: Page,
  portalSnapshot: PortalDiscenteSnapshot | null,
  mode: SyncMode,
  steps: SyncStep[],
  stages: SyncStageResult[]
): Promise<void> {
  if (!portalSnapshot) {
    pushStage(stages, "turma", "skipped", "Portal indisponível neste sync.");
    appendWarningStep(
      steps,
      "Turma virtual não atualizada (portal indisponível)",
      85
    );
    return;
  }

  steps.push({ label: "Sincronizando turma virtual…", progress: 70 });

  try {
    const turmaSnapshot = await scrapeTurmaVirtual(page, {
      semestreDisciplinas: portalSnapshot.semestreAtual,
      semestreLetivo: portalSnapshot.semestreLetivo,
      matricula: portalSnapshot.aluno.matricula,
      mode,
    });
    const turmaResult = persistTurmaVirtualSnapshot(turmaSnapshot);

    if (!turmaResult.persisted) {
      pushStage(stages, "turma", "warning", turmaResult.reason);
      appendWarningStep(
        steps,
        "Turma virtual indisponível (dados anteriores preservados)",
        85
      );
      return;
    }

    pruneInvalidSyncedTarefas();
    pruneOrphanSyncedTarefas();
    pushStage(stages, "turma", "ok");
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Falha na turma virtual.";
    console.warn("[sync] Falha na etapa turma virtual:", message);
    pushStage(stages, "turma", "warning", message);
    appendWarningStep(
      steps,
      "Turma virtual indisponível (dados anteriores preservados)",
      85
    );
  }
}

function assertPipelineViable(mode: SyncMode, stages: SyncStageResult[]): void {
  const normalized = normalizeSyncMode(mode);
  const portalOk = stages.some(
    (stage) => stage.stage === "portal" && stage.outcome === "ok"
  );

  if (normalized === "full" && !portalOk) {
    throw internalError(
      "Não foi possível sincronizar com o SIGAA. Verifique sua conexão ou tente novamente."
    );
  }
}

export async function executeLiveSyncPipeline(
  page: Page,
  mode: SyncMode
): Promise<SyncPipelineResult> {
  const steps: SyncStep[] = [{ label: "Autenticando no SIGAA…", progress: 15 }];
  const stages: SyncStageResult[] = [];

  try {
    const portalSnapshot = await runPortalStage(page, steps, stages);

    if (shouldRunHistoricoStage(mode)) {
      await runHistoricoStage(page, steps, stages);
    } else {
      pushStage(stages, "historico", "skipped", "Incremental — histórico recente.");
      steps.push({
        label: "Histórico escolar em dia (pulado)",
        progress: 55,
      });
    }

    await runTurmaStage(page, portalSnapshot, mode, steps, stages);
    assertPipelineViable(mode, stages);

    const partial = stages.some((stage) => stage.outcome === "warning");
    steps.push({ label: "Concluído", progress: 100 });

    return { steps, stages, partial };
  } catch (error) {
    if (error instanceof ScraperError) {
      throw error.toApiError();
    }
    if (error instanceof Error && error.message.includes("sincronizar")) {
      throw error;
    }
    throw mapUnknownScraperError(error).toApiError();
  }
}
