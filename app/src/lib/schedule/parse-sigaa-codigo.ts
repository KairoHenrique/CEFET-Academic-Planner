import {
  SIGAA_BLOCK_TO_SLOT_INDEX,
  SIGAA_DAY_TO_INDEX,
  type ScheduleCellPosition,
} from "./sigaa-slot-map";

const SIGAA_CODE_PATTERN = /^([2-6])([MTN])(12|34|56)$/i;

function parseSingleSigaaCode(token: string): ScheduleCellPosition | null {
  const match = token.trim().toUpperCase().match(SIGAA_CODE_PATTERN);
  if (!match) return null;

  const day = Number(match[1]);
  const block = `${match[2]}${match[3]}`.toUpperCase();
  const dayIdx = SIGAA_DAY_TO_INDEX[day];
  const slotIdx = SIGAA_BLOCK_TO_SLOT_INDEX[block];

  if (dayIdx === undefined || slotIdx === undefined) return null;
  return { dayIdx, slotIdx };
}

/** Converte `codigo_horario` do SIGAA (ex.: `4M12 6M56`) em posições da grade. */
export function parseSigaaCodigoHorario(
  codigoHorario: string | null | undefined
): ScheduleCellPosition[] {
  if (!codigoHorario?.trim()) return [];

  const tokens = codigoHorario.split(/[\s,;]+/).filter(Boolean);
  const positions: ScheduleCellPosition[] = [];
  const seen = new Set<string>();

  for (const token of tokens) {
    const position = parseSingleSigaaCode(token);
    if (!position) continue;

    const key = `${position.dayIdx}:${position.slotIdx}`;
    if (seen.has(key)) continue;
    seen.add(key);
    positions.push(position);
  }

  return positions;
}
