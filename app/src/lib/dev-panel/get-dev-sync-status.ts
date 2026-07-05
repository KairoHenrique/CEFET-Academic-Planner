import { isPostgresBackend } from "@/lib/db/backend/config";
import { getPostgresPool } from "@/lib/db/postgres/pool";
import { maskCpf } from "@/lib/dev-panel/mask-cpf";
import type {
  DevOrchestratorPlanItem,
  DevQueueJobView,
  DevSyncStatusResponse,
} from "@/lib/dev-panel/types";
import { readEffectiveSyncPolicyAsync, pgGetOrchestratorState } from "@/lib/sync-policy/app-config-store";
import {
  createEmptyOrchestratorState,
  planOrchestratorTick,
  type OrchestratorAction,
} from "@/lib/sync-orchestrator/plan-orchestrator-tick";
import {
  listQueuedSyncJobsOrdered,
  listRunningSyncJobs,
} from "@/lib/sync-queue/sync-queue-store";
import {
  computeQueuePosition,
  estimateQueueEtaSeconds,
} from "@/lib/sync-queue/estimate-queue-eta";
import type { SyncQueueJobRecord } from "@/lib/sync-queue/types";

function toDevQueueJobView(record: SyncQueueJobRecord): DevQueueJobView {
  return {
    jobId: record.id,
    cpfMasked: maskCpf(record.username),
    lane: record.lane,
    trigger: record.trigger,
    mode: record.mode,
    status: record.status,
    position: computeQueuePosition(record),
    etaSeconds: estimateQueueEtaSeconds(record),
    createdAt: record.createdAt,
    startedAt: record.startedAt,
  };
}

function formatOrchestratorAction(action: OrchestratorAction): string {
  if (action.type === "run_global_calendario") {
    return "R2 — Calendário global";
  }
  if (action.type === "run_global_turmas") {
    return `R3 — Turmas (${action.cursoId})`;
  }
  return `R1 — Deep sync (${maskCpf(action.cpf)})`;
}

async function loadOrchestratorState() {
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

export async function getDevSyncStatus(): Promise<DevSyncStatusResponse> {
  const policy = await readEffectiveSyncPolicyAsync();
  const state = await loadOrchestratorState();
  const eligibleCpfs = await listEligibleCpfsForDeepSync();
  const plan = planOrchestratorTick({
    now: new Date(),
    policy,
    state,
    eligibleCpfs,
  });

  const nextActions: DevOrchestratorPlanItem[] = plan.actions.map(
    (action, index) => ({
      order: index + 1,
      label: formatOrchestratorAction(action),
      reason: action.reason,
    })
  );

  const running = listRunningSyncJobs().map(toDevQueueJobView);
  const queued = listQueuedSyncJobsOrdered().map(toDevQueueJobView);

  return {
    queue: { running, queued },
    orchestrator: {
      inNightlyWindow: plan.inNightlyWindow,
      lastTickAt: state.lastTickAt,
      nextActions,
      policySummary: {
        nightlyEnabled: policy.nightly.enabled,
        nightlyWindow: policy.nightly.window,
        autoIntervalHours: policy.autoIntervalHours,
        workerMaxConcurrent: policy.workerMaxConcurrent,
      },
    },
  };
}
