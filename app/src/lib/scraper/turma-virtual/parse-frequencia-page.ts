import {
  extractTableRowsFromHtml,
  findTableByHeader,
  normalizeHeader,
  parseBrDateToIso,
  stripHtmlTags,
} from "@/lib/scraper/turma-virtual/html-utils";
import type { TurmaVirtualFalta } from "@/lib/scraper/types/turma-virtual";

const BR_DATE_PATTERN = /(\d{2}\/\d{2}\/\d{4})/g;
const LISTING_TABLE_PATTERN =
  /<table[^>]*class=["'][^"']*listing[^"']*["'][\s\S]*?<\/table>/i;
const FREQUENCIA_ROW_PATTERN =
  /(\d{2}\/\d{2}\/\d{4})[\s\S]{0,280}?(Presente|\d+\s+Falta(?:\(s\))?|Faltou|Falta|N[aã]o\s+Registrad[a-z]*)/gi;

export interface ParsedFrequenciaSituacao {
  status: TurmaVirtualFalta["status"];
  quantidade: number;
}

export function parseFrequenciaSituacao(value: string): ParsedFrequenciaSituacao {
  const plain = stripHtmlTags(value).replace(/\s+/g, " ").trim();
  if (!plain) return { status: "nao_registrada", quantidade: 0 };

  const countedAbsences = plain.match(/^(\d+)\s+Falta(?:\(s\))?/i);
  if (countedAbsences) {
    return {
      status: "falta",
      quantidade: Math.max(1, Number.parseInt(countedAbsences[1], 10) || 1),
    };
  }

  const normalized = normalizeHeader(plain);
  if (/presente|compareceu/.test(normalized)) {
    return { status: "presente", quantidade: 0 };
  }
  if (/faltou|^falta$/.test(normalized) || /falt/.test(normalized)) {
    return { status: "falta", quantidade: 1 };
  }
  if (/nao\s*registrad/.test(normalized)) {
    return { status: "nao_registrada", quantidade: 0 };
  }

  return { status: "nao_registrada", quantidade: 0 };
}

function dedupeFaltas(faltas: TurmaVirtualFalta[]): TurmaVirtualFalta[] {
  const byDate = new Map<string, TurmaVirtualFalta>();
  for (const falta of faltas) {
    byDate.set(falta.data, falta);
  }
  return Array.from(byDate.values()).sort((a, b) => a.data.localeCompare(b.data));
}

/** Layout CEFET mapa.jsf: tabela listing com Data + Situação. */
function parseCefetFrequenciaListingTable(html: string): TurmaVirtualFalta[] {
  const tableHtml = html.match(LISTING_TABLE_PATTERN)?.[0];
  if (!tableHtml) return [];

  const rows = extractTableRowsFromHtml(tableHtml);
  if (rows.length < 2) return [];

  const header = rows[0].map(normalizeHeader);
  const dateIndex = header.findIndex((cell) => cell.includes("data"));
  const statusIndex = header.findIndex(
    (cell) =>
      cell.includes("situ") ||
      cell.includes("freq") ||
      cell.includes("presen") ||
      cell.includes("falt") ||
      cell.includes("status")
  );

  if (dateIndex < 0) return [];

  const faltas: TurmaVirtualFalta[] = [];

  for (const row of rows.slice(1)) {
    const brDate = row[dateIndex]?.trim();
    if (!brDate) continue;

    const isoDate = parseBrDateToIso(brDate);
    if (!isoDate) continue;

    const statusCell =
      statusIndex >= 0 ? row[statusIndex] ?? "" : row.slice(1).join(" ");
    const parsed = parseFrequenciaSituacao(statusCell);

    faltas.push({
      data: isoDate,
      status: parsed.status,
      quantidade: parsed.quantidade,
    });
  }

  return faltas;
}

/** Fallback: pares data + situação espalhados no HTML. */
function parseSigaaFrequenciaMapa(html: string): TurmaVirtualFalta[] {
  const faltas: TurmaVirtualFalta[] = [];
  FREQUENCIA_ROW_PATTERN.lastIndex = 0;
  let match = FREQUENCIA_ROW_PATTERN.exec(html);

  while (match) {
    const isoDate = parseBrDateToIso(match[1]);
    if (!isoDate) {
      match = FREQUENCIA_ROW_PATTERN.exec(html);
      continue;
    }

    const parsed = parseFrequenciaSituacao(match[2]);
    faltas.push({
      data: isoDate,
      status: parsed.status,
      quantidade: parsed.quantidade,
    });
    match = FREQUENCIA_ROW_PATTERN.exec(html);
  }

  return faltas;
}

function parseGenericFrequencyTable(html: string): TurmaVirtualFalta[] {
  const rows = extractTableRowsFromHtml(html);
  const table = findTableByHeader(rows, [/data/i, /freq|presen|falt|situ/i]);
  if (!table) return [];

  const headers = table[0].map(normalizeHeader);
  const dateIndex = headers.findIndex((cell) => cell.includes("data"));
  const statusIndex = headers.findIndex(
    (cell) =>
      cell.includes("freq") ||
      cell.includes("presen") ||
      cell.includes("falt") ||
      cell.includes("situ") ||
      cell.includes("status")
  );

  if (dateIndex < 0) return [];

  const faltas: TurmaVirtualFalta[] = [];

  for (const row of table.slice(1)) {
    const brDate = row[dateIndex]?.trim();
    if (!brDate) continue;

    const isoDate = parseBrDateToIso(brDate);
    if (!isoDate) continue;

    const statusCell =
      statusIndex >= 0 ? row[statusIndex] ?? "" : row.slice(1).join(" ");
    const parsed = parseFrequenciaSituacao(statusCell);

    faltas.push({
      data: isoDate,
      status: parsed.status,
      quantidade: parsed.quantidade,
    });
  }

  return faltas;
}

export function hasParsableFrequencia(html: string): boolean {
  if (parseCefetFrequenciaListingTable(html).length > 0) return true;
  if (parseGenericFrequencyTable(html).length > 0) return true;

  FREQUENCIA_ROW_PATTERN.lastIndex = 0;
  return FREQUENCIA_ROW_PATTERN.test(html);
}

export function parseFrequenciaPageHtml(html: string): TurmaVirtualFalta[] {
  const listing = parseCefetFrequenciaListingTable(html);
  if (listing.length > 0) return dedupeFaltas(listing);

  const generic = parseGenericFrequencyTable(html);
  if (generic.length > 0) return dedupeFaltas(generic);

  const mapa = parseSigaaFrequenciaMapa(html);
  if (mapa.length > 0) return dedupeFaltas(mapa);

  const plainDates = html.match(BR_DATE_PATTERN) ?? [];
  if (plainDates.length === 0) return [];

  return dedupeFaltas(
    plainDates.map((data) => {
      const isoDate = parseBrDateToIso(data);
      return {
        data: isoDate ?? data,
        status: parseFrequenciaSituacao(html).status,
        quantidade: 0,
      };
    })
  );
}

export function sumFaltasQuantidade(faltas: TurmaVirtualFalta[]): number {
  return faltas.reduce(
    (total, falta) =>
      falta.status === "falta" ? total + Math.max(1, falta.quantidade ?? 1) : total,
    0
  );
}

export interface FrequenciaPageMeta {
  totalAulas: number | null;
  minFreqPercent: number | null;
  maxFaltas: number | null;
}

const TOTAL_AULAS_PATTERN =
  /N(?:[uúǧ]|&uacute;)mero de Aulas definidas pela CH do Componente:[\s\S]{0,48}?(\d+)/i;
const MIN_FREQ_PATTERN =
  /frequ(?:[eêǦ]|&ecirc;)ncia\s+m(?:[ií]|&iacute;)nima[\s\S]{0,120}?(\d+(?:[.,]\d+)?)\s*%/i;

/** Máximo de faltas permitidas: (100% − freq. mínima) × total de aulas. */
export function computeMaxFaltasFromAulasCh(
  totalAulas: number,
  minFreqPercent = 75
): number {
  if (totalAulas <= 0 || minFreqPercent <= 0 || minFreqPercent >= 100) return 0;
  const maxMissPercent = 100 - minFreqPercent;
  return Math.floor((totalAulas * maxMissPercent) / 100);
}

export function parseFrequenciaMetaFromHtml(html: string): FrequenciaPageMeta {
  const totalMatch = html.match(TOTAL_AULAS_PATTERN);
  const totalAulas = totalMatch
    ? Number.parseInt(totalMatch[1], 10)
    : null;

  const freqMatch = html.match(MIN_FREQ_PATTERN);
  const minFreqPercent = freqMatch
    ? Number.parseFloat(freqMatch[1].replace(",", "."))
    : 75;

  const maxFaltas =
    totalAulas !== null && Number.isFinite(totalAulas)
      ? computeMaxFaltasFromAulasCh(totalAulas, minFreqPercent)
      : null;

  return {
    totalAulas: Number.isFinite(totalAulas ?? NaN) ? totalAulas : null,
    minFreqPercent: Number.isFinite(minFreqPercent) ? minFreqPercent : null,
    maxFaltas,
  };
}

export function parseMaxFaltasFromFrequenciaHtml(
  html: string | null | undefined
): number | null {
  if (!html?.trim()) return null;
  return parseFrequenciaMetaFromHtml(html).maxFaltas;
}
