import { isCloudDeployment, isPostgresBackend } from "@/lib/db/backend/config";
import { isSqliteAllowed } from "@/lib/db/backend/sqlite-guard";
import { ensureDbReady } from "@/lib/db/bootstrap";
import { runWithUserDb } from "@/lib/db/connection-manager";
import { resolveSigaaPassword } from "@/lib/crypto/resolve-sigaa-password";
import { maskCpf } from "@/lib/dev-panel/mask-cpf";
import type {
  DevRobotRunRequest,
  DevRobotTargetResult,
} from "@/lib/dev-panel/types";
import { enqueueCloudSyncJob } from "@/lib/sync-queue/cloud-sync-queue";
import { readEffectiveSyncPolicyAsync } from "@/lib/sync-policy/app-config-store";
import { enqueueSyncJob } from "@/lib/sync-queue/enqueue-sync-job";
import { kickSyncQueueDispatcher } from "@/lib/sync-queue/sync-queue-dispatcher";
import { runSync } from "@/lib/sync/run-sync";
import { runWithSyncTenantContext } from "@/lib/sync/run-with-sync-tenant-context";

export async function runR1Robot(
  cpf: string,
  mode: DevRobotRunRequest["mode"]
): Promise<DevRobotTargetResult> {
  const masked = maskCpf(cpf);

  try {
    // Cloud (Cloudflare): despacha ao worker hospedado via fila Postgres —
    // a senha é resolvida no servidor a partir da credencial salva do CPF.
    if (isCloudDeployment()) {
      const enqueued = await enqueueCloudSyncJob({
        username: cpf,
        mode: mode ?? "deep",
        lane: "priority",
        trigger: "manual",
      });
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

    return await runWithSyncTenantContext(cpf, () =>
      runWithUserDb(cpf, async () => {
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
          robot: "r1" as const,
          status: "ok" as const,
          message: "R1 concluído.",
        };
      })
    );
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
