import {
  extractHorarioCodigoFromText,
  hasParseableSigaaHorario,
} from "@/lib/schedule/parse-sigaa-codigo";
import { resolveDisciplinaCodigoByNome } from "@/lib/scraper/portal-discente/resolve-disciplina-codigo";
import { buildTurmaSigaaId } from "@/lib/turmas-ofertadas/normalize-turmas-ofertadas-items";
import { stripHtmlTags } from "@/lib/scraper/turma-virtual/html-utils";
import type {
  TurmaOfertadaItem,
  TurmaOfertadaSituacao,
} from "@/lib/scraper/types/turmas-ofertadas";

const ALLOWED_SITUACOES = new Set<TurmaOfertadaSituacao>([
  "atendida",
  "pendente",
]);

interface SolicitacaoColumnMap {
  anoPeriodo: number;
  componente: number;
  tipo: number;
  situacao: number;
  horario: number;
  vagas: number;
}

function normalizeSemestreLabel(raw: string): string | null {
  const match = raw.match(/(\d{4})[-./]([12])/);
  if (!match) return null;
  return `${match[1]}.${match[2]}`;
}

function normalizeSituacao(raw: string): TurmaOfertadaSituacao | null {
  const text = raw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

  if (text.startsWith("atend")) return "atendida";
  if (text.startsWith("pend")) return "pendente";
  return null;
}

function parseInteger(value: string | null | undefined): number | null {
  if (!value?.trim()) return null;
  const digits = value.replace(/[^\d]/g, "");
  if (!digits) return null;
  const parsed = Number.parseInt(digits, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function extractRowCells(rowHtml: string): string[] {
  return Array.from(
    rowHtml.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)
  ).map((match) => stripHtmlTags(match[1] ?? "").replace(/\s+/g, " ").trim());
}

function parseComponenteSigaa(raw: string): {
  sigaaComponente: string | null;
  nome: string;
} {
  const text = raw.replace(/\s+/g, " ").trim();
  const match = text.match(/^([A-Z0-9.]+)\s*[-–]\s*(.+)$/i);
  if (match) {
    return {
      sigaaComponente: match[1].toUpperCase(),
      nome: match[2].trim(),
    };
  }
  return { sigaaComponente: null, nome: text };
}

function mapSolicitacaoColumns(cells: string[]): SolicitacaoColumnMap | null {
  const normalized = cells.map((cell) =>
    cell.replace(/\s+/g, " ").trim().toLowerCase()
  );

  const componente = normalized.findIndex((cell) => /componente/.test(cell));
  const situacao = normalized.findIndex((cell) => /situa/.test(cell));
  const horario = normalized.findIndex((cell) => /hor[aá]rio/.test(cell));

  if (componente < 0 || situacao < 0 || horario < 0) return null;

  return {
    anoPeriodo: normalized.findIndex((cell) => /ano/.test(cell)),
    componente,
    tipo: normalized.findIndex((cell) => /^tipo$/.test(cell)),
    situacao,
    horario,
    vagas: normalized.findIndex((cell) => /vagas?/.test(cell)),
  };
}

function buildTurmaSigaaIdForRow(
  semestre: string,
  sigaaKey: string,
  situacao: TurmaOfertadaSituacao,
  codigoHorario: string | null
): string {
  return buildTurmaSigaaId(semestre, sigaaKey, situacao, codigoHorario);
}

function isDepartmentHeaderRow(cells: string[]): string | null {
  if (cells.length !== 1 && !cells.every((cell, index) => index === 0 || !cell)) {
    const joined = cells.join(" ").trim();
    if (cells.filter(Boolean).length <= 1 && joined.length > 8) {
      return joined;
    }
  }

  const single = cells[0]?.trim() ?? "";
  if (
    cells.length >= 1 &&
    cells.slice(1).every((cell) => !cell) &&
    /departamento|DECOM|DFGD|DMGT|programa/i.test(single)
  ) {
    return single;
  }

  return null;
}

function resolveHorarioIndefinido(
  situacao: TurmaOfertadaSituacao,
  horarioCell: string,
  codigoHorario: string | null
): boolean {
  if (hasParseableSigaaHorario(codigoHorario)) return false;

  const fromCell = extractHorarioCodigoFromText(horarioCell);
  if (fromCell && hasParseableSigaaHorario(fromCell)) return false;

  if (!horarioCell.trim()) return true;
  return !codigoHorario && !fromCell;
}

export function parseSolicitacaoTurmasTable(
  tableHtml: string,
  semestreFallback: string
): TurmaOfertadaItem[] {
  const headerMatch = tableHtml.match(/<thead[\s\S]*?<\/thead>/i);
  const headerCells = headerMatch
    ? extractRowCells(headerMatch[0].match(/<tr[\s\S]*?<\/tr>/i)?.[0] ?? "")
    : [];
  const columns = mapSolicitacaoColumns(headerCells);
  if (!columns) return [];

  const turmas: TurmaOfertadaItem[] = [];
  let departamento: string | null = null;
  const rowPattern = /<tr[^>]*>[\s\S]*?<\/tr>/gi;
  let rowMatch = rowPattern.exec(tableHtml);

  while (rowMatch) {
    const rowHtml = rowMatch[0];
    rowMatch = rowPattern.exec(tableHtml);
    if (/<th[\s>]/i.test(rowHtml)) continue;

    const cells = extractRowCells(rowHtml);
    if (cells.length < 4) continue;

    const dept = isDepartmentHeaderRow(cells);
    if (dept) {
      departamento = dept;
      continue;
    }

    const situacao = normalizeSituacao(cells[columns.situacao] ?? "");
    if (!situacao || !ALLOWED_SITUACOES.has(situacao)) continue;

    const componenteRaw = cells[columns.componente] ?? "";
    const { sigaaComponente, nome } = parseComponenteSigaa(componenteRaw);
    if (!nome) continue;

    const semestre =
      (columns.anoPeriodo >= 0
        ? normalizeSemestreLabel(cells[columns.anoPeriodo] ?? "")
        : null) ?? semestreFallback;

    const horarioCell = cells[columns.horario] ?? "";
    const codigoHorario = extractHorarioCodigoFromText(horarioCell);
    const horarioIndefinido = resolveHorarioIndefinido(
      situacao,
      horarioCell,
      codigoHorario
    );
    const ppcCodigo = resolveDisciplinaCodigoByNome(nome);
    const sigaaKey = sigaaComponente ?? ppcCodigo;

    turmas.push({
      turmaSigaaId: buildTurmaSigaaIdForRow(
        semestre,
        sigaaKey,
        situacao,
        codigoHorario
      ),
      sigaaComponente,
      codigoDisciplina: ppcCodigo,
      nome,
      turmaCodigo: null,
      semestre,
      codigoHorario,
      horarioExibicao: horarioCell || null,
      local: null,
      professor: null,
      vagas: parseInteger(cells[columns.vagas] ?? ""),
      vagasOcupadas: null,
      cargaHoraria: null,
      situacao,
      tipoTurma:
        columns.tipo >= 0 ? cells[columns.tipo]?.trim() || null : null,
      departamento,
      horarioIndefinido,
    });
  }

  return turmas;
}

export function isSolicitacaoTurmasTableHtml(html: string): boolean {
  const plain = stripHtmlTags(html).replace(/\s+/g, " ");
  if (
    /ano[- ]per[ií]odo/i.test(plain) &&
    /componente/i.test(plain) &&
    /situa/i.test(plain) &&
    /hor[aá]rio/i.test(plain) &&
    /vagas/i.test(plain)
  ) {
    return true;
  }

  return (
    /solicita[çc][ãa]o de abertura de turma|lista de solicita[çc][õo]es/i.test(
      plain
    ) && /ano[- ]per[ií]odo.*componente.*situa[çc][ãa]o.*hor[aá]rio/i.test(plain)
  );
}
