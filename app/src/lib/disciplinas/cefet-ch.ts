/**
 * Carga horária e limite de faltas — regulamento CEFET (SCOPE §5.4).
 * PPC legado usava 25/50/75; currículo atual usa 30/60/75/90/120.
 */

export interface CefetChTier {
  ch: number;
  maxAbsences: number;
}

export const CEFET_CH_TIERS: readonly CefetChTier[] = [
  { ch: 30, maxAbsences: 7 },
  { ch: 45, maxAbsences: 11 },
  { ch: 60, maxAbsences: 15 },
  { ch: 75, maxAbsences: 18 },
  { ch: 90, maxAbsences: 22 },
  { ch: 120, maxAbsences: 30 },
] as const;

const LEGACY_PPC_CH_TO_CEFET: Record<number, number> = {
  12.5: 30,
  25: 30,
  50: 60,
  75: 75,
  100: 120,
};

const TIER_CH_SET = new Set(CEFET_CH_TIERS.map((tier) => tier.ch));

/** Converte CH do PPC antigo (25/50/75) para a escala vigente do CEFET. */
export function normalizeCefetCh(legacyOrCurrentCh: number): number {
  if (!Number.isFinite(legacyOrCurrentCh) || legacyOrCurrentCh <= 0) return 60;

  const mapped = LEGACY_PPC_CH_TO_CEFET[legacyOrCurrentCh];
  if (mapped !== undefined) return mapped;

  if (TIER_CH_SET.has(legacyOrCurrentCh)) return legacyOrCurrentCh;

  let closest = CEFET_CH_TIERS[0].ch;
  let minDiff = Math.abs(legacyOrCurrentCh - closest);
  for (const tier of CEFET_CH_TIERS) {
    const diff = Math.abs(legacyOrCurrentCh - tier.ch);
    if (diff < minDiff) {
      minDiff = diff;
      closest = tier.ch;
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
