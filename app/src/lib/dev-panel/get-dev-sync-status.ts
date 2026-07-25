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
import { resolveNextAcademicSemesterLabel } from "@/lib/academic/resolve-academic-semester";
import {
  listQueuedSyncJobsOrdered,
  listRunningSyncJobs,
} from "@/lib/sync-queue/sync-queue-store";
import {
  computeQueuePosition,
  estimateQueueEtaSeconds,
} from "@/lib/sync-queue/estimate-queue-eta";
import {
  pgListSyncJobsByStatus,
  type PgSyncJobRow,
} from "@/lib/sync-queue/pg-sync-jobs-store";
import { pgReclaimStaleSyncJobs } from "@/lib/sync-queue/reclaim-stale-sync-jobs";
import { SYNC_QUEUE_DEFAULT_ETA_SECONDS } from "@/lib/sync-queue/types";
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

function toIso(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toISOString();
}

function pgRowToDevQueueJobView(row: PgSyncJobRow): DevQueueJobView {
  const position =
    row.status === "queued" ? Number(row.queue_position ?? 0) + 1 : 0;
  return {
    jobId: row.id,
    cpfMasked: maskCpf(row.username),
    lane: row.lane,
    trigger: row.trigger_source,
    mode: row.mode,
    status: row.status,
    position,
    etaSeconds:
      row.status === "queued" || row.status === "running"
        ? SYNC_QUEUE_DEFAULT_ETA_SECONDS * Math.max(position, 1)
        : 0,
    createdAt: toIso(row.created_at) ?? row.created_at,
    startedAt: toIso(row.started_at),
    finishedAt: toIso(row.finished_at),
    robot: row.robot,
    errorCode: row.error_code,
    errorMessage: row.error_message,
  };
}

async function loadCloudQueue(): Promise<{
  running: DevQueueJobView[];
  queued: DevQueueJobView[];
  failed: DevQueueJobView[];
}> {
  const pool = getPostgresPool();
  await pgReclaimStaleSyncJobs(pool);
  const [running, queued, failed] = await Promise.all([
    pgListSyncJobsByStatus(pool, {
      statuses: ["running"],
      limit: 50,
      order: "started_asc",
    }),
    pgListSyncJobsByStatus(pool, {
      statuses: ["queued"],
      limit: 50,
      order: "created_asc",
    }),
    pgListSyncJobsByStatus(pool, {
      statuses: ["failed"],
      limit: 20,
      order: "finished_desc",
    }),
  ]);

  return {
    running: running.map(pgRowToDevQueueJobView),
    queued: queued.map(pgRowToDevQueueJobView),
    failed: failed.map(pgRowToDevQueueJobView),
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
  const targetSemester = resolveNextAcademicSemesterLabel(new Date());
  let hasTurmas = false;
  if (isPostgresBackend()) {
    const pool = getPostgresPool();
    const result = await pool.query<{ count: string }>(
      `SELECT count(*) as count FROM turmas_ofertadas_catalog WHERE semestre = $1`,
      [targetSemester]
    );
    hasTurmas = parseInt(result.rows[0].count, 10) > 0;
  } else {
    const { getTurmasOfertadas } = await import("@/lib/db/queries");
    hasTurmas = getTurmasOfertadas(targetSemester).length > 0;
  }

  const plan = planOrchestratorTick({
    now: new Date(),
    policy,
    state,
    eligibleCpfs,
    hasTurmas,
  });

  const nextActions: DevOrchestratorPlanItem[] = plan.actions.map(
    (action, index) => ({
      order: index + 1,
      label: formatOrchestratorAction(action),
      reason: action.reason,
    })
  );

  const queue = isPostgresBackend()
    ? await loadCloudQueue()
    : {
        running: listRunningSyncJobs().map(toDevQueueJobView),
        queued: listQueuedSyncJobsOrdered().map(toDevQueueJobView),
        failed: [] as DevQueueJobView[],
      };

  return {
    queue,
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
