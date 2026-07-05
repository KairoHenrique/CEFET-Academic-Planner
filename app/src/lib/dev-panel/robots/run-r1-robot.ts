import { isPostgresBackend } from "@/lib/db/backend/config";
import { isSqliteAllowed } from "@/lib/db/backend/sqlite-guard";
import { ensureDbReady } from "@/lib/db/bootstrap";
import { runWithUserDb } from "@/lib/db/connection-manager";
import { resolveSigaaPassword } from "@/lib/crypto/resolve-sigaa-password";
import { maskCpf } from "@/lib/dev-panel/mask-cpf";
import type {
  DevRobotRunRequest,
  DevRobotTargetResult,
} from "@/lib/dev-panel/types";
import { readEffectiveSyncPolicyAsync } from "@/lib/sync-policy/app-config-store";
import { enqueueSyncJob } from "@/lib/sync-queue/enqueue-sync-job";
import { kickSyncQueueDispatcher } from "@/lib/sync-queue/sync-queue-dispatcher";
import { runSync } from "@/lib/sync/run-sync";

export async function runR1Robot(
  cpf: string,
  mode: DevRobotRunRequest["mode"]
): Promise<DevRobotTargetResult> {
  const masked = maskCpf(cpf);

  try {
    const password = await resolveSigaaPassword({ username: cpf });

    if (isPostgresBackend()) {
      const enqueued = await enqueueSyncJob({
        username: cpf,
        password,
        trigger: "dev",
        skipCooldown: true,
        mode: mode ?? "deep",
      });
      const policy = await readEffectiveSyncPolicyAsync();
      if (isSqliteAllowed()) {
        kickSyncQueueDispatcher(policy.workerMaxConcurrent);
      }

      return {
        cpfMasked: masked,
        robot: "r1",
        status: "ok",
        message: enqueued.reused
          ? "Job R1 já enfileirado."
          : "Job R1 enfileirado.",
        jobId: enqueued.job.jobId,
      };
    }

    return await runWithUserDb(cpf, async () => {
      ensureDbReady();
      await runSync(
        {
          username: cpf,
          password,
          savePassword: false,
          mode: mode ?? "deep",
          trigger: "dev",
        },
        { mode: mode ?? "deep" }
      );

      return {
        cpfMasked: masked,
        robot: "r1",
        status: "ok",
        message: "R1 concluído.",
      };
    });
  } catch (error) {
    return {
      cpfMasked: masked,
      robot: "r1",
      status: "failed",
      message:
        error instanceof Error ? error.message : "Falha ao executar R1.",
    };
  }
}
