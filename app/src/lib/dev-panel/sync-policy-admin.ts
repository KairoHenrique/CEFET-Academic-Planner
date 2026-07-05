import { validationError } from "@/lib/api/errors";
import {
  mergeSyncPolicyOverrides,
  parseSyncPolicyOverrides,
} from "@/lib/sync-policy/merge-effective-policy";
import {
  readEffectiveSyncPolicyAsync,
  readSyncPolicyOverridesAsync,
  writeSyncPolicyOverridesAsync,
} from "@/lib/sync-policy/app-config-store";
import type { DevSyncPolicyResponse } from "@/lib/dev-panel/types";
import type { SyncPolicyOverrides } from "@/lib/sync-policy/types";

function assertPolicyPatch(patch: SyncPolicyOverrides): void {
  if (patch.autoIntervalHours !== undefined && patch.autoIntervalHours <= 0) {
    throw validationError("autoIntervalHours deve ser positivo.");
  }

  if (
    patch.manualCooldownMinutes !== undefined &&
    patch.manualCooldownMinutes < 0
  ) {
    throw validationError("manualCooldownMinutes não pode ser negativo.");
  }

  if (
    patch.workerMaxConcurrent !== undefined &&
    (patch.workerMaxConcurrent < 1 || patch.workerMaxConcurrent > 8)
  ) {
    throw validationError("workerMaxConcurrent deve estar entre 1 e 8.");
  }

  if (patch.nightly?.window !== undefined) {
    if (!/^\d{2}:\d{2}-\d{2}:\d{2}$/.test(patch.nightly.window.trim())) {
      throw validationError('nightly.window deve usar formato "HH:MM-HH:MM".');
    }
  }
}

function mergeOverrides(
  current: SyncPolicyOverrides | null,
  patch: SyncPolicyOverrides
): SyncPolicyOverrides {
  return {
    ...current,
    ...patch,
    layers: {
      ...current?.layers,
      ...patch.layers,
    },
    globalCalendario: {
      ...current?.globalCalendario,
      ...patch.globalCalendario,
    },
    globalTurmasByCurso: {
      ...current?.globalTurmasByCurso,
      ...patch.globalTurmasByCurso,
    },
    nightly: {
      ...current?.nightly,
      ...patch.nightly,
    },
  };
}

export async function getDevSyncPolicy(): Promise<DevSyncPolicyResponse> {
  const effective = await readEffectiveSyncPolicyAsync();
  const overrides = await readSyncPolicyOverridesAsync();
  const hasOverrides = overrides && Object.keys(overrides).length > 0;

  return {
    effective,
    overrides: hasOverrides ? overrides : null,
  };
}

export async function patchDevSyncPolicy(
  patch: SyncPolicyOverrides
): Promise<DevSyncPolicyResponse> {
  assertPolicyPatch(patch);

  const current = await readSyncPolicyOverridesAsync();
  const merged = mergeOverrides(current, patch);
  parseSyncPolicyOverrides(merged);
  mergeSyncPolicyOverrides(merged);
  await writeSyncPolicyOverridesAsync(merged);

  return getDevSyncPolicy();
}

export async function resetDevSyncPolicy(): Promise<DevSyncPolicyResponse> {
  await writeSyncPolicyOverridesAsync({});
  return getDevSyncPolicy();
}
