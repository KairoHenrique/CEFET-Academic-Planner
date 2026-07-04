/** Espelho de `src/lib/disciplinas/cefet-ch.ts` para scripts Node (parse PPC). */
const VALID_CEFET_CH = [30, 60, 90, 120];

const LEGACY_PPC_CH_TO_CEFET = {
  12.5: 30,
  15: 30,
  25: 30,
  50: 60,
  75: 90,
  100: 120,
};

function normalizeCefetCh(value) {
  if (!Number.isFinite(value) || value <= 0) return 60;

  const mapped = LEGACY_PPC_CH_TO_CEFET[value];
  if (mapped !== undefined) return mapped;

  if (VALID_CEFET_CH.includes(value)) return value;

  let closest = VALID_CEFET_CH[0];
  let minDiff = Math.abs(value - closest);
  for (const tier of VALID_CEFET_CH) {
    const diff = Math.abs(value - tier);
    if (diff < minDiff) {
      minDiff = diff;
      closest = tier;
    }
  }
  return closest;
}

module.exports = { normalizeCefetCh, VALID_CEFET_CH };
