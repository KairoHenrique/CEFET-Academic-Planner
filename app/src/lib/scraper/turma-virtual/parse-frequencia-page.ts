import {
  extractTableRowsFromHtml,
  findTableByHeader,
  normalizeHeader,
  parseBrDateToIso,
} from "@/lib/scraper/turma-virtual/html-utils";
import type { TurmaVirtualFalta } from "@/lib/scraper/types/turma-virtual";

const BR_DATE_PATTERN = /(\d{2}\/\d{2}\/\d{4})/g;

function mapFrequenciaStatus(value: string): TurmaVirtualFalta["status"] {
  const normalized = normalizeHeader(value);
  if (/falt|ausen|ausente/.test(normalized)) return "falta";
  if (/presente|compareceu/.test(normalized)) return "presente";
  return "nao_registrada";
}

/** Layout CEFET mapa.jsf: pares data + status em linhas alternadas. */
function parseSigaaFrequenciaMapa(html: string): TurmaVirtualFalta[] {
  const faltas: TurmaVirtualFalta[] = [];
  const rowPattern =
    /(\d{2}\/\d{2}\/\d{4})[\s\S]{0,220}?(Presente|Faltou|Falta|N[aã]o registrado)/gi;
  let match = rowPattern.exec(html);

  while (match) {
    faltas.push({
      data: match[1],
      status: mapFrequenciaStatus(match[2]),
    });
    match = rowPattern.exec(html);
  }

  return faltas;
}

export function parseFrequenciaPageHtml(html: string): TurmaVirtualFalta[] {
  const mapa = parseSigaaFrequenciaMapa(html);
  if (mapa.length > 0) return mapa;

  const rows = extractTableRowsFromHtml(html);
  const table = findTableByHeader(rows, [/data/i, /freq|presen|falt/i]);
  if (!table) {
    const plainDates = html.match(BR_DATE_PATTERN) ?? [];
    if (plainDates.length === 0) return [];

    return plainDates.map((data) => ({
      data,
      status: mapFrequenciaStatus(html),
    }));
  }

  const headers = table[0].map(normalizeHeader);
  const dateIndex = headers.findIndex((cell) => cell.includes("data"));
  const statusIndex = headers.findIndex(
    (cell) =>
      cell.includes("freq") ||
      cell.includes("presen") ||
      cell.includes("falt") ||
      cell.includes("status")
  );

  if (dateIndex < 0) return [];

  const faltas: TurmaVirtualFalta[] = [];

  for (const row of table.slice(1)) {
    const brDate = row[dateIndex]?.trim();
    if (!brDate) continue;

    if (!parseBrDateToIso(brDate)) continue;

    const statusCell =
      statusIndex >= 0 ? row[statusIndex] ?? "" : row.slice(1).join(" ");
    faltas.push({
      data: brDate,
      status: mapFrequenciaStatus(statusCell),
    });
  }

  return faltas;
}
