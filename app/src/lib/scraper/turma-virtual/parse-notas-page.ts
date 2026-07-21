import {
  extractTableRowsFromHtml,
  extractTitleAttributes,
  findTableByHeader,
  normalizeHeader,
  parseBrDecimal,
} from "@/lib/scraper/turma-virtual/html-utils";
import type { TurmaVirtualNota } from "@/lib/scraper/types/turma-virtual";

const SCORE_HEADER_PATTERN =
  /^(pro\d*|p\d+|np\d*|sem|av\d*|at\d*|tr\d*|tp\d*|t\d+|n\d+|pi\d*|reposicao)$/i;
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
]);

interface SigaaAvalMeta {
  abrev: string;
  nome: string;
  notaMaxima: number | null;
}

/** Metadados das avaliações no HTML ao vivo do SIGAA/CEFET (inputs hidden). */
function extractSigaaHiddenAvaliacoes(html: string): SigaaAvalMeta[] {
  const list: SigaaAvalMeta[] = [];
  const pattern = /id="abrevAval_(\d+)"\s+value="([^"]*)"/gi;
  let match = pattern.exec(html);

  while (match) {
    const id = match[1];
    const abrev = match[2]?.trim() ?? "";
    if (!abrev) {
      match = pattern.exec(html);
      continue;
    }

    const nome =
      html.match(new RegExp(`id="denAval_${id}"\\s+value="([^"]*)"`, "i"))?.[1]?.trim() ??
      abrev;
    const maxRaw = html.match(
      new RegExp(`id="notaAval_${id}"\\s+value="([^"]*)"`, "i")
    )?.[1];

    list.push({
      abrev,
      nome,
      notaMaxima: parseBrDecimal(maxRaw ?? null),
    });
    match = pattern.exec(html);
  }

  return list;
}

function hiddenMetaByAbrev(list: SigaaAvalMeta[]): Map<string, SigaaAvalMeta> {
  return new Map(list.map((item) => [item.abrev, item]));
}

function parseTooltipMaxima(title: string | undefined): number | null {
  if (!title) return null;
  const match = title.match(/nota\s*m[aá]xima\s*:\s*([\d,.]+)/i);
  return match ? parseBrDecimal(match[1]) : null;
}

function parseTooltipAvaliacao(title: string | undefined, fallback: string): string {
  if (!title) return fallback;
  const match = title.match(/avalia[cç][aã]o\s*:\s*([^|<]+)/i);
  return match?.[1]?.trim() || fallback;
}

function isUnitTotalNotaHeader(header: string, scoreHeaders: string[]): boolean {
  if (normalizeHeader(header) !== "nota") return false;
  return scoreHeaders.some((item) => /^pro\d*$/i.test(normalizeHeader(item)));
}

function isHiddenAvalHeader(
  header: string,
  hidden: Map<string, SigaaAvalMeta>
): boolean {
  const trimmed = header.trim();
  return trimmed.length > 0 && hidden.has(trimmed);
}

function isScoreHeader(
  header: string,
  scoreHeaders: string[],
  hidden?: Map<string, SigaaAvalMeta>
): boolean {
  const normalized = normalizeHeader(header);
  if (!normalized || SKIP_SCORE_HEADERS.has(normalized)) return false;
  if (isUnitTotalNotaHeader(header, scoreHeaders)) return false;
  if (hidden && isHiddenAvalHeader(header, hidden)) return true;
  return SCORE_HEADER_PATTERN.test(normalized);
}

export interface ParseNotasPageOptions {
  /** Matrícula do aluno logado — necessária quando a página lista todos os alunos (ex.: AOC). */
  matricula?: string | null;
}

function normalizeMatricula(value: string): string {
  return value.replace(/\D/g, "");
}

function rowMatchesMatricula(row: string[], matricula: string): boolean {
  const normalized = normalizeMatricula(matricula);
  if (!normalized || normalized.length < 8) return false;

  for (const cell of row) {
    const trimmed = cell.trim();
    if (!trimmed) continue;

    const cellDigits = normalizeMatricula(trimmed);
    if (cellDigits.length >= 8) {
      if (cellDigits === normalized) return true;
      if (cellDigits.startsWith(normalized)) return true;
    }

    if (trimmed.startsWith(normalized)) return true;
    if (new RegExp(`\\b${normalized}\\b`).test(trimmed)) return true;
  }

  return false;
}

function isStudentDataRow(row: string[]): boolean {
  return row.some(
    (cell) => /^\d{8,}/.test(cell.trim()) || isIdentityCell(cell.trim())
  );
}

function looksLikeTableHeaderRow(row: string[]): boolean {
  return row.some((cell) =>
    /^(matr[ií]cula|nome|unid\.?\s*\d*|faltas|situa[cç][aã]o)$/i.test(
      normalizeHeader(cell)
    )
  );
}

function isIdentityCell(cell: string): boolean {
  const trimmed = cell.trim();
  if (!trimmed) return false;
  if (/^\d{8,}(\s|$)/.test(trimmed)) return true;
  return trimmed.length > 24 && !/^(\d+[,.]\d+|-+|—|--)$/i.test(trimmed);
}

function isGradeCell(cell: string): boolean {
  const trimmed = cell.trim();
  if (!trimmed) return true;
  return /^(\d+[,.]\d+|-+|—|--)$/i.test(trimmed);
}

function extractGradeValues(dataRow: string[]): string[] {
  const hasIdentity = dataRow.some(
    (cell) => isIdentityCell(cell) || /^\d{8,}$/.test(cell.trim())
  );

  if (!hasIdentity) {
    return dataRow.map((cell) => cell.trim()).filter((cell) => isGradeCell(cell));
  }

  const values: string[] = [];
  let identitySkipped = false;

  for (const cell of dataRow) {
    const trimmed = cell.trim();

    if (!identitySkipped && (isIdentityCell(trimmed) || /^\d{8,}$/.test(trimmed))) {
      identitySkipped = true;
      continue;
    }

    if (identitySkipped && isGradeCell(trimmed)) {
      values.push(trimmed);
    }
  }

  return values;
}

function listScoreHeaders(
  subHeaders: string[],
  hidden?: Map<string, SigaaAvalMeta>
): string[] {
  const raw = subHeaders.map((cell) => cell.trim()).filter(Boolean);
  return raw.filter((header) => isScoreHeader(header, raw, hidden));
}

function resolveAvalMeta(
  header: string,
  titles: Record<string, string>,
  hidden: Map<string, SigaaAvalMeta>
): { avaliacaoNome: string; notaMaxima: number | null } {
  const meta = hidden.get(header);
  if (meta) {
    return { avaliacaoNome: meta.nome, notaMaxima: meta.notaMaxima };
  }

  const title = titles[header];
  return {
    avaliacaoNome: parseTooltipAvaliacao(title, header),
    notaMaxima: parseTooltipMaxima(title),
  };
}

function extractNotasFromHeaderRow(
  subHeaders: string[],
  dataRow: string[],
  titles: Record<string, string>,
  hidden: Map<string, SigaaAvalMeta>
): TurmaVirtualNota[] {
  const scoreHeaders = listScoreHeaders(subHeaders, hidden);
  const gradeValues = extractGradeValues(dataRow);
  const notas: TurmaVirtualNota[] = [];

  for (let index = 0; index < scoreHeaders.length; index += 1) {
    const header = scoreHeaders[index]!;
    const { avaliacaoNome, notaMaxima } = resolveAvalMeta(header, titles, hidden);
    const rawValue = gradeValues[index] ?? null;

    notas.push({
      avaliacaoNome,
      notaMaxima,
      notaObtida: parseBrDecimal(rawValue),
    });
  }

  return notas;
}

function buildNotasFromHiddenOnly(hidden: SigaaAvalMeta[]): TurmaVirtualNota[] {
  return hidden.map((meta) => ({
    avaliacaoNome: meta.nome,
    notaMaxima: meta.notaMaxima,
    notaObtida: null,
  }));
}

function isPlausibleNotasExtract(
  dataRow: string[] | null,
  notas: TurmaVirtualNota[]
): boolean {
  if (notas.length === 0) return false;
  if (dataRow?.some((cell) => /^\d{8,}/.test(cell.trim()))) return true;
  return notas.some(
    (nota) => nota.notaObtida !== null || nota.notaMaxima !== null
  );
}

function rowHasScoreHeaders(
  row: string[],
  hidden?: Map<string, SigaaAvalMeta>
): boolean {
  const headers = row.map((cell) => cell.trim()).filter(Boolean);
  return (
    headers.filter((header) => isScoreHeader(header, headers, hidden)).length >=
    1
  );
}

function listStudentDataRows(rows: string[][], startIndex: number): string[][] {
  const dataRows: string[][] = [];

  for (const row of rows.slice(startIndex + 1)) {
    if (looksLikeTableHeaderRow(row)) break;
    if (isStudentDataRow(row)) {
      dataRows.push(row);
    }
  }

  return dataRows;
}

function findStudentDataRow(
  rows: string[][],
  startIndex: number,
  matricula?: string | null
): string[] | null {
  const dataRows = listStudentDataRows(rows, startIndex);

  if (matricula?.trim()) {
    const matched = dataRows.find((row) => rowMatchesMatricula(row, matricula));
    if (matched) return matched;
    return null;
  }

  if (dataRows.length > 0) return dataRows[0];

  for (const row of rows.slice(startIndex + 1, startIndex + 5)) {
    if (looksLikeTableHeaderRow(row)) break;

    if (row.some((cell) => /^\d+[,.]\d+$/.test(cell.trim()))) {
      return row;
    }
  }

  return null;
}

function parseFaltasFromStudentRow(
  rows: string[][],
  subHeaderIndex: number,
  dataRow: string[]
): number | null {
  return null;
}

function parseMaxFaltasFromRows(rows: string[][]): number | null {
  return null;
}

function parseSigaaAlunosMatriculados(
  rows: string[][],
  titles: Record<string, string>,
  hidden: Map<string, SigaaAvalMeta>,
  matricula?: string | null
): {
  notas: TurmaVirtualNota[];
  maxFaltas: number | null;
} {
  const subHeaderIndices = rows
    .map((row, index) => ({ row, index }))
    .filter(({ row }) => rowHasScoreHeaders(row, hidden))
    .map(({ index }) => index);

  for (const subHeaderIndex of subHeaderIndices) {
    const subHeaders = rows[subHeaderIndex];
    const dataRow = findStudentDataRow(rows, subHeaderIndex, matricula);
    if (!dataRow) continue;

    const notas = extractNotasFromHeaderRow(subHeaders, dataRow, titles, hidden);
    if (!isPlausibleNotasExtract(dataRow, notas)) continue;

    return {
      notas,
      maxFaltas: parseFaltasFromStudentRow(rows, subHeaderIndex, dataRow),
    };
  }

  return { notas: [], maxFaltas: null };
}

export function parseNotasPageHtml(
  html: string,
  options: ParseNotasPageOptions = {}
): {
  notas: TurmaVirtualNota[];
  maxFaltas: number | null;
} {
  const hiddenList = extractSigaaHiddenAvaliacoes(html);
  const hidden = hiddenMetaByAbrev(hiddenList);
  const rows = extractTableRowsFromHtml(html);
  const titles = extractTitleAttributes(html);
  const matricula = options.matricula ?? null;

  const sigaa = parseSigaaAlunosMatriculados(rows, titles, hidden, matricula);
  if (sigaa.notas.length > 0) {
    return sigaa;
  }

  const table = findTableByHeader(rows, [/pro\d|p\d|nota|resultado|sem|av\d|at\d/i]);
  if (table && table.length >= 2) {
    const headers = table[0];
    const studentRows = table.slice(1).filter((row) => isStudentDataRow(row));
    const values =
      (matricula
        ? studentRows.find((row) => rowMatchesMatricula(row, matricula))
        : studentRows[0]) ?? table[1];
    const notas = extractNotasFromHeaderRow(headers, values, titles, hidden);

    const faltasIndex = headers.findIndex((header) =>
      /^faltas$/i.test(normalizeHeader(header))
    );
    const maxFaltas =
      faltasIndex >= 0 ? parseBrDecimal(values[faltasIndex] ?? null) : null;

    if (notas.length > 0) {
      return { notas, maxFaltas };
    }
  }

  if (hiddenList.length > 0) {
    return {
      notas: buildNotasFromHiddenOnly(hiddenList),
      maxFaltas: parseMaxFaltasFromRows(rows),
    };
  }

  return { notas: [], maxFaltas: null };
}

export function hasParsableNotas(html: string): boolean {
  if (/abrevAval_\d+/i.test(html) || /id=["']trAval["']/i.test(html)) {
    return true;
  }

  const { notas } = parseNotasPageHtml(html);
  return notas.some(
    (nota) => nota.notaObtida !== null || nota.notaMaxima !== null
  );
}

export function countLaunchedNotas(notas: TurmaVirtualNota[]): number {
  return notas.filter((nota) => nota.notaObtida !== null).length;
}
