import {
  resolveDayIndexFromAbbrev,
  resolveSlotIndexFromStartTime,
  type ScheduleCellPosition,
} from "./sigaa-slot-map";

const TRADUZIDO_SEGMENT =
  /^(Seg|Ter|Qua|Qui|Sex|Segunda|Terça|Terca|Quarta|Quinta|Sexta)\s+(\d{1,2}:\d{2})/i;

/** Fallback quando `codigo_horario` ainda não veio do scraper (ex.: seed demo). */
export function parseHorarioTraduzido(
  horarioTraduzido: string | null | undefined
): ScheduleCellPosition[] {
  if (!horarioTraduzido?.trim()) return [];

  const segments = horarioTraduzido.split(/[·•,;]+/).map((part) => part.trim());
  const positions: ScheduleCellPosition[] = [];
  const seen = new Set<string>();

  for (const segment of segments) {
    const match = segment.match(TRADUZIDO_SEGMENT);
    if (!match) continue;

    const dayIdx = resolveDayIndexFromAbbrev(match[1]);
    const slotIdx = resolveSlotIndexFromStartTime(match[2]);
    if (dayIdx === null || slotIdx === null) continue;

    const key = `${dayIdx}:${slotIdx}`;
    if (seen.has(key)) continue;
    seen.add(key);
    positions.push({ dayIdx, slotIdx });
  }

  return positions;
}
