import { isPostgresBackend } from "@/lib/db/backend/config";
import { ensureDbReady } from "@/lib/db/bootstrap";
import { runWithUserDb } from "@/lib/db/connection-manager";
import { resolveSigaaPassword } from "@/lib/crypto/resolve-sigaa-password";
import { maskCpf } from "@/lib/dev-panel/mask-cpf";
import type { DevRobotTargetResult } from "@/lib/dev-panel/types";
import { runTurmasOfertadasSync } from "@/lib/sync/run-turmas-ofertadas-sync";

export async function runR3Robot(cpf: string): Promise<DevRobotTargetResult> {
  const masked = maskCpf(cpf);

  if (isPostgresBackend()) {
    return {
      cpfMasked: masked,
      robot: "r3",
      status: "skipped",
      message:
        "R3 é global em produção — use “Rodar global” ou aguarde o cron B68e.",
    };
  }

  try {
    const password = await resolveSigaaPassword({ username: cpf });
    const result = await runWithUserDb(cpf, async () => {
      ensureDbReady();
      return runTurmasOfertadasSync(
        { username: cpf, password, savePassword: false },
        { force: true }
      );
    });

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
