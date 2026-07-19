import {
  SIGAA_BLOCK_TO_SLOT_INDEX,
  SIGAA_DAY_TO_INDEX,
  type ScheduleCellPosition,
} from "./sigaa-slot-map";

/** Um ou mais dias (2-6) + turno + bloco(s) - ex.: `4M34`, `46M56`, `2M1234`. */
export const SIGAA_HORARIO_TOKEN_PATTERN = /^([2-6]+)([MTN])([1-6]+)$/i;

/** Extrai tokens de horario em texto livre (com datas entre parenteses). */
export const SIGAA_HORARIO_TEXT_PATTERN = /\b[2-6]+[MTN][1-6]+\b/gi;

function parseSigaaToken(token: string): ScheduleCellPosition[] {
  const match = token.trim().toUpperCase().match(SIGAA_HORARIO_TOKEN_PATTERN);
  if (!match) return [];

  const days = match[1];
  const shift = match[2];
  const hours = match[3];

  const blocks: string[] = [];
  for (let i = 0; i < hours.length; i += 2) {
    blocks.push(`${shift}${hours.substring(i, i + 2)}`);
  }

  const positions: ScheduleCellPosition[] = [];
  for (const block of blocks) {
    const slotIdx = SIGAA_BLOCK_TO_SLOT_INDEX[block];
    if (slotIdx === undefined) continue;

    for (const digit of days) {
      const day = Number(digit);
      const dayIdx = SIGAA_DAY_TO_INDEX[day];
      if (dayIdx === undefined) continue;
      positions.push({ dayIdx, slotIdx });
    }
  }

  return positions;
}

/** Converte `codigo_horario` do SIGAA (ex.: `4M12 46M56`) em posições da grade. */
export function parseSigaaCodigoHorario(
  codigoHorario: string | null | undefined
): ScheduleCellPosition[] {
  if (!codigoHorario?.trim()) return [];

  const tokens = codigoHorario.split(/[\s,;]+/).filter(Boolean);
  const positions: ScheduleCellPosition[] = [];
  const seen = new Set<string>();

  for (const token of tokens) {
    for (const position of parseSigaaToken(token)) {
      const key = `${position.dayIdx}:${position.slotIdx}`;
      if (seen.has(key)) continue;
      seen.add(key);
      positions.push(position);
    }
  }

  return positions;
}

export function extractHorarioCodigoFromText(value: string): string | null {
  const matches = value.match(SIGAA_HORARIO_TEXT_PATTERN);
  if (!matches?.length) return null;
  return matches.join(" ").toUpperCase();
}

export function hasParseableSigaaHorario(
  codigoHorario: string | null | undefined
): boolean {
  return parseSigaaCodigoHorario(codigoHorario).length > 0;
}
