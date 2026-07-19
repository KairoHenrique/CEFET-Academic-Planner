import { isCloudDeployment, isPostgresBackend } from "@/lib/db/backend/config";
import { runWithScraperSqlite } from "@/lib/db/backend/sqlite-guard";
import { ensureDbReady } from "@/lib/db/bootstrap";
import { runWithUserDb } from "@/lib/db/connection-manager";
import { resolveSigaaPassword } from "@/lib/crypto/resolve-sigaa-password";
import { maskCpf } from "@/lib/dev-panel/mask-cpf";
import type { DevRobotTargetResult } from "@/lib/dev-panel/types";
import { enqueueCloudSyncJob } from "@/lib/sync-queue/cloud-sync-queue";
import { runTurmasOfertadasSync } from "@/lib/sync/run-turmas-ofertadas-sync";
import { runWithSyncTenantContext } from "@/lib/sync/run-with-sync-tenant-context";

export async function runR3Robot(cpf: string): Promise<DevRobotTargetResult> {
  const masked = maskCpf(cpf);

  try {
    // Cloud (Cloudflare): Playwright não roda no worker web — despacha o robô
    // `turmas` ao worker do PC via fila Postgres (senha resolvida no servidor).
    if (isCloudDeployment()) {
      const enqueued = await enqueueCloudSyncJob({
        username: cpf,
        mode: "deep",
        lane: "priority",
        trigger: "manual",
        robot: "turmas",
      });
      return {
        cpfMasked: masked,
        robot: "r3",
        status: "ok",
        message: enqueued.reused
          ? "Job de turmas já enfileirado."
          : "Job de turmas enfileirado.",
        jobId: enqueued.job.jobId,
      };
    }

    const password = await resolveSigaaPassword({ username: cpf });
    // Local (SQLite ou Postgres com staging): roda o scraper direto.
    const result = await runWithScraperSqlite(() =>
      runWithSyncTenantContext(cpf, () =>
        runWithUserDb(cpf, async () => {
          ensureDbReady();
          return runTurmasOfertadasSync(
            { username: cpf, password, savePassword: false },
            { force: true }
          );
        })
      )
    );

    return {
      cpfMasked: masked,
      robot: "r3",
      status: result.ok ? "ok" : "failed",
      message: result.message,
    };
  } catch (error) {
    return {
      cpfMasked: masked,
      robot: "r3",
      status: "failed",
      message:
        error instanceof Error ? error.message : "Falha ao executar R3.",
    };
  }
}

export async function runR3GlobalRobot(): Promise<DevRobotTargetResult> {
  if (!isPostgresBackend()) {
    return {
      cpfMasked: "global",
      robot: "r3",
      status: "skipped",
      message: "R3 global requer Postgres + orquestrador B68e.",
    };
  }

  const { runSyncOrchestratorTick } = await import(
    "@/lib/sync-orchestrator/run-orchestrator-tick"
  );
  const tick = await runSyncOrchestratorTick({ force: true });
  const ran = tick.executed.some((item) =>
    item.action.startsWith("global_turmas")
  );

  return {
    cpfMasked: "global",
    robot: "r3",
    status: ran ? "ok" : "skipped",
    message: ran
      ? "Turmas global atualizadas (state/tick)."
      : "Turmas global não executadas neste tick.",
  };
}
