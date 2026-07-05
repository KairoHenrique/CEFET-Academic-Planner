import { isPostgresBackend } from "@/lib/db/backend/config";
import { getPostgresPool } from "@/lib/db/postgres/pool";
import { isSqliteAllowed } from "@/lib/db/backend/sqlite-guard";
import { kickSyncQueueDispatcher } from "@/lib/sync-queue/sync-queue-dispatcher";
import { enqueueSyncJob } from "@/lib/sync-queue/enqueue-sync-job";
import {
  pgGetOrchestratorState,
  pgSetOrchestratorState,
  readEffectiveSyncPolicyAsync,
} from "@/lib/sync-policy/app-config-store";
import {
  createEmptyOrchestratorState,
  planOrchestratorTick,
  type OrchestratorState,
} from "@/lib/sync-orchestrator/plan-orchestrator-tick";

export interface OrchestratorTickResult {
  ok: true;
  plan: ReturnType<typeof planOrchestratorTick>;
  executed: Array<{ action: string; status: "done" | "skipped" | "queued" }>;
}

async function loadOrchestratorState(): Promise<OrchestratorState> {
  const state = createEmptyOrchestratorState();
  if (!isPostgresBackend()) {
    return state;
  }

  state.calendarioLastAt = await pgGetOrchestratorState("global.calendario");
  for (const cursoId of [
    "eng-computacao",
    "eng-mecatronica",
    "design-moda",
  ] as const) {
    state.turmasLastAtByCurso[cursoId] = await pgGetOrchestratorState(
      `global.turmas.${cursoId}`
    );
  }
  state.lastTickAt = await pgGetOrchestratorState("orchestrator.last_tick");
  return state;
}

async function persistOrchestratorState(
  state: OrchestratorState,
  nowIso: string
): Promise<void> {
  if (!isPostgresBackend()) return;

  await pgSetOrchestratorState("orchestrator.last_tick", nowIso);
}

async function listEligibleCpfsForDeepSync(): Promise<string[]> {
  if (!isPostgresBackend()) {
    return [];
  }

  const pool = getPostgresPool();
  const result = await pool.query<{ cpf: string }>(
    `SELECT cpf FROM app_profiles
     WHERE sigaa_password_enc IS NOT NULL
       AND length(trim(sigaa_password_enc)) > 0
     ORDER BY cpf`
  );
  return result.rows.map((row) => row.cpf);
}

async function markGlobalActionDone(
  actionType: "run_global_calendario" | "run_global_turmas",
  cursoId: string | null,
  nowIso: string
): Promise<void> {
  if (!isPostgresBackend()) return;

  if (actionType === "run_global_calendario") {
    await pgSetOrchestratorState("global.calendario", nowIso);
    return;
  }

  if (cursoId) {
    await pgSetOrchestratorState(`global.turmas.${cursoId}`, nowIso);
  }
}

export async function runSyncOrchestratorTick(options?: {
  force?: boolean;
  now?: Date;
}): Promise<OrchestratorTickResult> {
  const now = options?.now ?? new Date();
  const policy = await readEffectiveSyncPolicyAsync();
  const state = await loadOrchestratorState();
  const eligibleCpfs = await listEligibleCpfsForDeepSync();

  const plan = planOrchestratorTick({
    now,
    policy,
    state,
    eligibleCpfs,
    force: options?.force,
  });

  const executed: OrchestratorTickResult["executed"] = [];

  for (const action of plan.actions) {
    if (action.type === "run_global_calendario") {
      await markGlobalActionDone("run_global_calendario", null, plan.now);
      executed.push({
        action: `global_calendario:${action.reason}`,
        status: "done",
      });
      continue;
    }

    if (action.type === "run_global_turmas") {
      await markGlobalActionDone(
        "run_global_turmas",
        action.cursoId,
        plan.now
      );
      executed.push({
        action: `global_turmas:${action.cursoId}:${action.reason}`,
        status: "done",
      });
      continue;
    }

    if (action.type === "enqueue_r1_deep") {
      if (!isSqliteAllowed()) {
        executed.push({
          action: `enqueue_deep:${action.cpf}`,
          status: "skipped",
        });
        continue;
      }

      try {
        await enqueueSyncJob({
          username: action.cpf,
          mode: "deep",
          trigger: "auto",
          skipCooldown: true,
          idempotencyKey: `orchestrator-deep:${action.cpf}:${plan.now.slice(0, 10)}`,
        });
        executed.push({
          action: `enqueue_deep:${action.cpf}`,
          status: "queued",
        });
      } catch {
        executed.push({
          action: `enqueue_deep:${action.cpf}`,
          status: "skipped",
        });
      }
    }
  }

  await persistOrchestratorState(state, plan.now);

  if (isSqliteAllowed()) {
    kickSyncQueueDispatcher(policy.workerMaxConcurrent);
  }

  return { ok: true, plan, executed };
}
