import type { AppCursoId } from "@/lib/auth/account/types";

export type SyncButtonScope = "lite" | "full";
export type SyncR1Scope = "full" | "lite" | "deep";

export type GlobalRefreshMode = "interval" | "fixed_at";

export interface GlobalRefreshPolicy {
  mode: GlobalRefreshMode;
  /** Intervalo em dias (mode=interval). */
  days?: number;
  /** ISO8601 ou `YYYY-MM-DDTHH:mm` (mode=fixed_at). */
  at?: string;
}

export interface SyncPolicyLayerTtls {
  notasTarefasHours: number;
  faltasHours: number;
  grupoHours: number;
  historicoDays: number;
}

export interface SyncPolicyNightly {
  enabled: boolean;
  /** `"03:00-06:00"` — fuso local do servidor. */
  window: string;
}

export interface SyncPolicyDocument {
  buttonScope: SyncButtonScope;
  autoIntervalHours: number;
  manualCooldownMinutes: number;
  layers: SyncPolicyLayerTtls;
  globalCalendario: GlobalRefreshPolicy;
  globalTurmasByCurso: Partial<Record<AppCursoId, GlobalRefreshPolicy>>;
  nightly: SyncPolicyNightly;
  workerMaxConcurrent: number;
}

export type SyncPolicyOverrides = Partial<{
  buttonScope: SyncButtonScope;
  autoIntervalHours: number;
  manualCooldownMinutes: number;
  layers: Partial<SyncPolicyLayerTtls>;
  globalCalendario: Partial<GlobalRefreshPolicy>;
  globalTurmasByCurso: Partial<
    Record<AppCursoId, Partial<GlobalRefreshPolicy>>
  >;
  nightly: Partial<SyncPolicyNightly>;
  workerMaxConcurrent: number;
}>;

export interface EffectiveSyncPolicy extends SyncPolicyDocument {
  source: "defaults" | "merged";
}
