import {
  SYNC_AUTO_INTERVAL_PROD_MINUTES,
  SYNC_MANUAL_COOLDOWN_MS,
} from "@/lib/sync/sync-cooldown-policy";
import type { SyncPolicyDocument } from "@/lib/sync-policy/types";

/** Defaults alinhados a SCOPE-CLOUD §6.6 (jul/2026). */
export const DEFAULT_SYNC_POLICY: SyncPolicyDocument = {
  buttonScope: "lite",
  autoIntervalHours: SYNC_AUTO_INTERVAL_PROD_MINUTES / 60,
  manualCooldownMinutes: Math.round(SYNC_MANUAL_COOLDOWN_MS / 60_000),
  layers: {
    notasTarefasHours: 6,
    faltasHours: 12,
    grupoHours: 48,
    historicoDays: 7,
  },
  globalCalendario: { mode: "interval", days: 7 },
  globalTurmasByCurso: {
    "eng-computacao": { mode: "interval", days: 1 },
    "eng-mecatronica": { mode: "interval", days: 1 },
    "design-moda": { mode: "interval", days: 1 },
  },
  nightly: {
    enabled: true,
    window: "03:00-06:00",
  },
  workerMaxConcurrent: 2,
};
