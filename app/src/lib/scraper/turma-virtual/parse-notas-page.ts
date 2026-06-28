import {
  extractTableRowsFromHtml,
  extractTitleAttributes,
  findTableByHeader,
  normalizeHeader,
  parseBrDecimal,
} from "@/lib/scraper/turma-virtual/html-utils";
import type { TurmaVirtualNota } from "@/lib/scraper/types/turma-virtual";

const NOTA_HEADER_PATTERN = /^(pro1|pro2|sem|nota|reposicao|resultado|faltas|situacao|sit)$/i;
const SKIP_SCORE_HEADERS = new Set([
  "resultado",
  "faltas",
  "situacao",
  "sit",
  "reposicao",
  "reposição",
  "matricula",
  "matrícula",
  "nome",
  "unid",
  "reposição",
]);

function parseTooltipMaxima(title: string | undefined): number | null {
  if (!title) return null;
  const match = title.match(/nota\s*m[aá]xima\s*:\s*([\d,.]+)/i);
  return match ? parseBrDecimal(match[1]) : null;
}

function parseTooltipAvaliacao(title: string | undefined, fallback: string): string {
  if (!title) return fallback;
  const match = title.match(/avalia[cç][aã]o\s*:\s*([^|]+)/i);
  return match?.[1]?.trim() || fallback;
}

/** Layout CEFET: linha de subcabeçalho PRO1/SEM/PRO2 + linha de dados do aluno. */
function parseSigaaAlunosMatriculados(rows: string[][]): {
  notas: TurmaVirtualNota[];
  maxFaltas: number | null;
} {
  const subHeaderIndex = rows.findIndex((row) =>
    row.some((cell) => /^pro1$/i.test(cell.trim()))
  );
  if (subHeaderIndex < 0) {
    return { notas: [], maxFaltas: null };
  }

  const subHeaders = rows[subHeaderIndex];
  const dataRow = rows
    .slice(subHeaderIndex + 1)
    .find((row) => /^\d{8,}$/.test(row[0]?.trim() ?? ""));

  if (!dataRow) {
    return { notas: [], maxFaltas: null };
  }

  const notas: TurmaVirtualNota[] = [];
  for (let index = 0; index < subHeaders.length; index += 1) {
    const header = subHeaders[index]?.trim();
    if (!header || !NOTA_HEADER_PATTERN.test(normalizeHeader(header))) continue;
    if (SKIP_SCORE_HEADERS.has(normalizeHeader(header))) continue;

    notas.push({
      avaliacaoNome: header,
      notaMaxima: null,
      notaObtida: parseBrDecimal(dataRow[index] ?? null),
    });
  }

  const faltasValue = dataRow.findLast((cell) => /^\d+$/.test(cell.trim()));
  return {
    notas,
    maxFaltas: faltasValue ? parseBrDecimal(faltasValue) : null,
  };
}

export function parseNotasPageHtml(html: string): {
  notas: TurmaVirtualNota[];
  maxFaltas: number | null;
} {
  const rows = extractTableRowsFromHtml(html);
  const sigaa = parseSigaaAlunosMatriculados(rows);
  if (sigaa.notas.length > 0) {
    return sigaa;
  }

  const titles = extractTitleAttributes(html);
  const table = findTableByHeader(rows, [/pro1|nota|resultado/i]);
  if (!table || table.length < 2) {
    return { notas: [], maxFaltas: null };
  }

  const headers = table[0];
  const values = table[1];
  const notas: TurmaVirtualNota[] = [];

  for (let index = 0; index < headers.length; index += 1) {
    const header = headers[index]?.trim();
    if (!header || !NOTA_HEADER_PATTERN.test(normalizeHeader(header))) continue;
    if (SKIP_SCORE_HEADERS.has(normalizeHeader(header))) continue;

    const title = titles[header];
    notas.push({
      avaliacaoNome: parseTooltipAvaliacao(title, header),
      notaMaxima: parseTooltipMaxima(title),
      notaObtida: parseBrDecimal(values[index] ?? null),
    });
  }

  const faltasIndex = headers.findIndex((header) =>
    /^faltas$/i.test(normalizeHeader(header))
  );
  const maxFaltas =
    faltasIndex >= 0 ? parseBrDecimal(values[faltasIndex] ?? null) : null;

  return { notas, maxFaltas };
}
