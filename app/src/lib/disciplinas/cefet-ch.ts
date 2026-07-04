/**
 * Carga horária e limite de faltas — regulamento CEFET (SCOPE §5.4).
 * CH canônica no app: apenas 30 · 60 · 90 · 120.
 * PPC (col. hora-aula ou legado): 25→30 · 50→60 · 75→90 · 100→120.
 */

export const VALID_CEFET_CH = [30, 60, 90, 120] as const;

export type ValidCefetCh = (typeof VALID_CEFET_CH)[number];

export interface CefetChTier {
  ch: ValidCefetCh;
  maxAbsences: number;
}

export const CEFET_CH_TIERS: readonly CefetChTier[] = [
  { ch: 30, maxAbsences: 7 },
  { ch: 60, maxAbsences: 15 },
  { ch: 90, maxAbsences: 22 },
  { ch: 120, maxAbsences: 30 },
] as const;

/** PPC hora-aula / valores legados → CH canônica (30/60/90/120). */
const LEGACY_PPC_CH_TO_CEFET: Record<number, ValidCefetCh> = {
  12.5: 30,
  15: 30,
  25: 30,
  50: 60,
  75: 90,
  100: 120,
};

const TIER_CH_SET = new Set<number>(VALID_CEFET_CH);

/** Normaliza qualquer CH do PPC/SIGAA para 30, 60, 90 ou 120. */
export function normalizeCefetCh(legacyOrCurrentCh: number): ValidCefetCh {
  if (!Number.isFinite(legacyOrCurrentCh) || legacyOrCurrentCh <= 0) return 60;

  const mapped = LEGACY_PPC_CH_TO_CEFET[legacyOrCurrentCh];
  if (mapped !== undefined) return mapped;

  if (TIER_CH_SET.has(legacyOrCurrentCh)) {
    return legacyOrCurrentCh as ValidCefetCh;
  }

  let closest: ValidCefetCh = VALID_CEFET_CH[0];
  let minDiff = Math.abs(legacyOrCurrentCh - closest);
  for (const tier of VALID_CEFET_CH) {
    const diff = Math.abs(legacyOrCurrentCh - tier);
    if (diff < minDiff) {
      minDiff = diff;
      closest = tier;
    }
  }
  return closest;
}

/** Máximo de faltas (horários-aula) para a CH da disciplina. */
export function maxAbsencesFromCefetCh(ch: number): number {
  const normalized = normalizeCefetCh(ch);
  return (
    CEFET_CH_TIERS.find((tier) => tier.ch === normalized)?.maxAbsences ?? 15
  );
}
