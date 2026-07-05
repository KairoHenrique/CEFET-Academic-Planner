import type { AppCursoId } from "@/lib/auth/account/types";
import type { EffectiveSyncPolicy } from "@/lib/sync-policy/types";
import { isGlobalRefreshDue } from "@/lib/sync-orchestrator/global-refresh-scheduler";
import { isWithinNightlyWindow } from "@/lib/sync-orchestrator/nightly-window";

export type OrchestratorAction =
  | { type: "run_global_calendario"; reason: string }
  | { type: "run_global_turmas"; cursoId: AppCursoId; reason: string }
  | { type: "enqueue_r1_deep"; cpf: string; reason: string };

export interface OrchestratorState {
  calendarioLastAt: string | null;
  turmasLastAtByCurso: Partial<Record<AppCursoId, string | null>>;
  lastTickAt: string | null;
}

export interface OrchestratorTickPlan {
  now: string;
  inNightlyWindow: boolean;
  actions: OrchestratorAction[];
}

const ACTIVE_CURSO_IDS: AppCursoId[] = [
  "eng-computacao",
  "eng-mecatronica",
  "design-moda",
];

export function createEmptyOrchestratorState(): OrchestratorState {
  return {
    calendarioLastAt: null,
    turmasLastAtByCurso: {},
    lastTickAt: null,
  };
}

export function planOrchestratorTick(input: {
  now: Date;
  policy: EffectiveSyncPolicy;
  state: OrchestratorState;
  eligibleCpfs: string[];
  force?: boolean;
}): OrchestratorTickPlan {
  const actions: OrchestratorAction[] = [];
  const force = input.force === true;
  const inNightlyWindow = isWithinNightlyWindow(
    input.policy.nightly.window,
    input.now
  );

  if (
    isGlobalRefreshDue(
      input.policy.globalCalendario,
      input.state.calendarioLastAt,
      input.now,
      force
    )
  ) {
    actions.push({
      type: "run_global_calendario",
      reason: force ? "force" : "ttl_calendario",
    });
  }

  for (const cursoId of ACTIVE_CURSO_IDS) {
    const turmaPolicy =
      input.policy.globalTurmasByCurso[cursoId] ?? {
        mode: "interval" as const,
        days: 1,
      };
    const lastAt = input.state.turmasLastAtByCurso[cursoId] ?? null;

    if (isGlobalRefreshDue(turmaPolicy, lastAt, input.now, force)) {
      actions.push({
        type: "run_global_turmas",
        cursoId,
        reason: force ? "force" : `ttl_turmas_${cursoId}`,
      });
    }
  }

  const shouldEnqueueDeep =
    force ||
    (input.policy.nightly.enabled && inNightlyWindow);

  if (shouldEnqueueDeep) {
    for (const cpf of input.eligibleCpfs) {
      actions.push({
        type: "enqueue_r1_deep",
        cpf,
        reason: force ? "force" : "nightly_batch",
      });
    }
  }

  return {
    now: input.now.toISOString(),
    inNightlyWindow,
    actions,
  };
}
