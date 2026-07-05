import { isPostgresBackend } from "@/lib/db/backend/config";
import { ensureDbReady } from "@/lib/db/bootstrap";
import { runWithUserDb } from "@/lib/db/connection-manager";
import { resolveSigaaPassword } from "@/lib/crypto/resolve-sigaa-password";
import { maskCpf } from "@/lib/dev-panel/mask-cpf";
import type { DevRobotTargetResult } from "@/lib/dev-panel/types";
import { runCalendarioSync } from "@/lib/sync/run-calendario-sync";

export async function runR2Robot(cpf: string): Promise<DevRobotTargetResult> {
  const masked = maskCpf(cpf);

  if (isPostgresBackend()) {
    return {
      cpfMasked: masked,
      robot: "r2",
      status: "skipped",
      message:
        "R2 é global em produção — use “Rodar global” ou aguarde o cron B68e.",
    };
  }

  try {
    const password = await resolveSigaaPassword({ username: cpf });
    const result = await runWithUserDb(cpf, async () => {
      ensureDbReady();
      return runCalendarioSync(
        { username: cpf, password, savePassword: false },
        { force: true }
      );
    });

    return {
      cpfMasked: masked,
      robot: "r2",
      status: result.ok ? "ok" : "failed",
      message: result.message,
    };
  } catch (error) {
    return {
      cpfMasked: masked,
      robot: "r2",
      status: "failed",
      message:
        error instanceof Error ? error.message : "Falha ao executar R2.",
    };
  }
}

export async function runR2GlobalRobot(): Promise<DevRobotTargetResult> {
  if (!isPostgresBackend()) {
    return {
      cpfMasked: "global",
      robot: "r2",
      status: "skipped",
      message: "R2 global requer Postgres + orquestrador B68e.",
    };
  }

  const { runSyncOrchestratorTick } = await import(
    "@/lib/sync-orchestrator/run-orchestrator-tick"
  );
  const tick = await runSyncOrchestratorTick({ force: true });
  const ran = tick.executed.some((item) =>
    item.action.startsWith("global_calendario")
  );

  return {
    cpfMasked: "global",
    robot: "r2",
    status: ran ? "ok" : "skipped",
    message: ran
      ? "Calendário global atualizado (state/tick)."
      : "Calendário global não executado neste tick.",
  };
}
