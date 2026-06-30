import { createMockSession } from "@/lib/scraper/auth";
import { scrapePortalDiscenteMock } from "@/lib/scraper/portal-discente/scrape-portal-discente";
import { scrapeTurmaVirtualMock } from "@/lib/scraper/turma-virtual/scrape-turma-virtual";
import { scrapeHistoricoMock } from "@/lib/scraper/historico/scrape-historico";
import { pruneInvalidSyncedTarefas, pruneOrphanSyncedTarefas } from "@/lib/db/queries";
import { persistPortalSnapshot } from "@/lib/sync/persist-portal-snapshot";
import { persistTurmaVirtualSnapshot } from "@/lib/sync/persist-turma-virtual-snapshot";
import { persistHistoricoSnapshot } from "@/lib/sync/persist-historico-snapshot";
import { shouldRunHistoricoStage } from "@/lib/sync/sync-stage-plan";
import { recordHistoricoSyncedAt } from "@/lib/sync/sync-preferences";
import type { ResolvedSyncCredentials } from "@/lib/sync/resolve-credentials";
import type { SyncMode, SyncPipelineResult, SyncStageResult } from "@/lib/types/sync-pipeline";
import type { SyncStep } from "@/lib/types/sync";
import type { SigaaSession } from "@/lib/scraper/types";

function pushStage(
  stages: SyncStageResult[],
  stage: SyncStageResult["stage"],
  outcome: SyncStageResult["outcome"]
): void {
  stages.push({ stage, outcome });
}

export function executeMockSyncPipeline(
  credentials: ResolvedSyncCredentials,
  mode: SyncMode
): SyncPipelineResult & { session: SigaaSession } {
  const steps: SyncStep[] = [
    { label: "Autenticando no SIGAA (Mock)…", progress: 15 },
  ];
  const stages: SyncStageResult[] = [];

  const session = createMockSession(credentials);

  steps.push({ label: "Carregando portal do discente…", progress: 35 });
  persistPortalSnapshot(scrapePortalDiscenteMock(credentials.username));
  pushStage(stages, "portal", "ok");

  if (shouldRunHistoricoStage(mode)) {
    steps.push({ label: "Baixando histórico escolar…", progress: 60 });
    persistHistoricoSnapshot(scrapeHistoricoMock());
    recordHistoricoSyncedAt();
    pushStage(stages, "historico", "ok");
  } else {
    pushStage(stages, "historico", "skipped");
  }

  steps.push({ label: "Sincronizando turma virtual…", progress: 80 });
  persistTurmaVirtualSnapshot(scrapeTurmaVirtualMock());
  pruneInvalidSyncedTarefas();
  pruneOrphanSyncedTarefas();
  pushStage(stages, "turma", "ok");

  steps.push({ label: "Concluído", progress: 100 });

  return { steps, stages, partial: false, session };
}
