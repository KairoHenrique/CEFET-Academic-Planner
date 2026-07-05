import { DEFAULT_SYNC_POLICY } from "@/lib/sync-policy/defaults";
import type {
  EffectiveSyncPolicy,
  GlobalRefreshPolicy,
  SyncPolicyDocument,
  SyncPolicyOverrides,
} from "@/lib/sync-policy/types";

function mergeGlobalRefresh(
  base: GlobalRefreshPolicy,
  patch?: Partial<GlobalRefreshPolicy>
): GlobalRefreshPolicy {
  if (!patch) return base;
  return {
    mode: patch.mode ?? base.mode,
    days: patch.days ?? base.days,
    at: patch.at ?? base.at,
  };
}

export function mergeSyncPolicyOverrides(
  overrides: SyncPolicyOverrides | null | undefined
): EffectiveSyncPolicy {
  if (!overrides || Object.keys(overrides).length === 0) {
    return { ...DEFAULT_SYNC_POLICY, source: "defaults" };
  }

  const base = DEFAULT_SYNC_POLICY;
  const merged: SyncPolicyDocument = {
    buttonScope: overrides.buttonScope ?? base.buttonScope,
    autoIntervalHours: overrides.autoIntervalHours ?? base.autoIntervalHours,
    manualCooldownMinutes:
      overrides.manualCooldownMinutes ?? base.manualCooldownMinutes,
    layers: {
      ...base.layers,
      ...overrides.layers,
    },
    globalCalendario: mergeGlobalRefresh(
      base.globalCalendario,
      overrides.globalCalendario
    ),
    globalTurmasByCurso: {
      ...base.globalTurmasByCurso,
      ...Object.fromEntries(
        Object.entries(overrides.globalTurmasByCurso ?? {}).map(
          ([cursoId, patch]) => [
            cursoId,
            mergeGlobalRefresh(
              base.globalTurmasByCurso[cursoId as keyof typeof base.globalTurmasByCurso] ?? {
                mode: "interval",
                days: 1,
              },
              patch
            ),
          ]
        )
      ),
    },
    nightly: {
      ...base.nightly,
      ...overrides.nightly,
    },
    workerMaxConcurrent:
      overrides.workerMaxConcurrent ?? base.workerMaxConcurrent,
  };

  return { ...merged, source: "merged" };
}

export function parseSyncPolicyOverrides(
  raw: unknown
): SyncPolicyOverrides | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error("sync.policy.overrides deve ser um objeto JSON.");
  }
  return raw as SyncPolicyOverrides;
}
