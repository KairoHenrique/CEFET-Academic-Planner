import {
  SIGAA_BLOCK_TO_SLOT_INDEX,
  SIGAA_DAY_TO_INDEX,
  type ScheduleCellPosition,
} from "./sigaa-slot-map";

/** Um ou mais dias (2–6) + turno + bloco — ex.: `4M34`, `46M56`. */
export const SIGAA_HORARIO_TOKEN_PATTERN = /^([2-6]+)([MTN])(12|34|56)$/i;

/** Extrai tokens de horário em texto livre (com datas entre parênteses). */
export const SIGAA_HORARIO_TEXT_PATTERN = /\b[2-6]+[MTN](?:12|34|56)\b/gi;

function parseSigaaToken(token: string): ScheduleCellPosition[] {
  const match = token.trim().toUpperCase().match(SIGAA_HORARIO_TOKEN_PATTERN);
  if (!match) return [];

  const block = `${match[2]}${match[3]}`.toUpperCase();
  const slotIdx = SIGAA_BLOCK_TO_SLOT_INDEX[block];
  if (slotIdx === undefined) return [];

  const positions: ScheduleCellPosition[] = [];
  for (const digit of match[1]) {
    const day = Number(digit);
    const dayIdx = SIGAA_DAY_TO_INDEX[day];
    if (dayIdx === undefined) continue;
    positions.push({ dayIdx, slotIdx });
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
