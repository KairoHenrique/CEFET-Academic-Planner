import { resolveNextAcademicSemesterLabel } from "@/lib/academic/resolve-academic-semester";
import {
  extractHorarioCodigo,
} from "@/lib/scraper/portal-discente/parse-portal-horario";
import {
  isPortalDiscenteHomeForTurmas,
} from "@/lib/scraper/turmas-ofertadas/is-turmas-ofertadas-page";
import {
  isSolicitacaoTurmasTableHtml,
  parseSolicitacaoTurmasTable,
} from "@/lib/scraper/turmas-ofertadas/parse-solicitacao-turmas-html";
import { normalizeTurmasOfertadasItems } from "@/lib/turmas-ofertadas/normalize-turmas-ofertadas-items";
import { stripHtmlTags } from "@/lib/scraper/turma-virtual/html-utils";
import type {
  TurmaOfertadaItem,
  TurmasOfertadasSnapshot,
} from "@/lib/scraper/types/turmas-ofertadas";

const SEMESTRE_PATTERN = /(\d{4}\.\d)/;

function inferSemestreFromHtml(html: string, fallback: string): string {
  const plain = stripHtmlTags(html);
  const dotted = plain.match(SEMESTRE_PATTERN);
  if (dotted?.[1]) return dotted[1];

  const dashed = plain.match(/(\d{4})[-/]([12])/);
  if (dashed) return `${dashed[1]}.${dashed[2]}`;

  return fallback;
}

function extractListagemTables(html: string): string[] {
  return Array.from(
    html.matchAll(/<table[^>]*class=["'][^"']*listagem[^"']*["'][\s\S]*?<\/table>/gi)
  ).map((match) => match[0]);
}

function parseLegacyListagemTable(
  tableHtml: string,
  semestreAlvo: string
): TurmaOfertadaItem[] {
  const headerMatch = tableHtml.match(/<thead[\s\S]*?<\/thead>/i);
  const headerCells = headerMatch
    ? Array.from(
        (headerMatch[0].match(/<tr[\s\S]*?<\/tr>/i)?.[0] ?? "").matchAll(
          /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi
        )
      ).map((match) => stripHtmlTags(match[1] ?? "").trim())
    : [];

  const normalized = headerCells.map((cell) => cell.toLowerCase());
  const componente = normalized.findIndex((cell) =>
    /componente|disciplina/.test(cell)
  );
  const horario = normalized.findIndex((cell) => /hor[aá]rio/.test(cell));
  if (componente < 0 || horario < 0) return [];

  const turmas: TurmaOfertadaItem[] = [];
  const rowPattern = /<tr[^>]*>[\s\S]*?<\/tr>/gi;
  let rowMatch = rowPattern.exec(tableHtml);

  while (rowMatch) {
    const rowHtml = rowMatch[0];
    rowMatch = rowPattern.exec(tableHtml);

    if (/<th[\s>]/i.test(rowHtml)) continue;

    const cells = Array.from(rowHtml.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)).map(
      (match) => stripHtmlTags(match[1] ?? "").replace(/\s+/g, " ").trim()
    );
    const componenteRaw = cells[componente] ?? "";
    if (!componenteRaw || componenteRaw.length < 3) continue;

    const horarioCell = cells[horario] ?? "";
    const codigoHorario = extractHorarioCodigo(horarioCell);
    if (!codigoHorario) continue;

    const nome = componenteRaw.replace(/\([^)]+\)\s*$/, "").trim() || componenteRaw;
    const codeMatch = componenteRaw.match(/\(([A-Z0-9._-]+)\)/i);
    const codigoDisciplina = codeMatch?.[1]?.toUpperCase() ?? nome.slice(0, 12).toUpperCase();

    turmas.push({
      turmaSigaaId: `${semestreAlvo}:${codigoDisciplina}:00:${codigoHorario}`,
      sigaaComponente: null,
      codigoDisciplina,
      nome,
      turmaCodigo: null,
      semestre: semestreAlvo,
      codigoHorario,
      horarioExibicao: horarioCell,
      local: null,
      professor: null,
      vagas: null,
      vagasOcupadas: null,
      cargaHoraria: null,
      situacao: "atendida",
      tipoTurma: "Turma Regular",
      departamento: null,
      horarioIndefinido: false,
    });
  }

  return turmas;
}

export interface ParseTurmasOfertadasOptions {
  semestreAlvo?: string;
  referenceDate?: Date;
}

export function parseTurmasOfertadasHtml(
  html: string,
  options?: ParseTurmasOfertadasOptions
): TurmasOfertadasSnapshot {
  const referenceDate = options?.referenceDate ?? new Date();
  const semestreFallback =
    options?.semestreAlvo ?? resolveNextAcademicSemesterLabel(referenceDate);
  const semestreAlvo = inferSemestreFromHtml(html, semestreFallback);
  const scrapedAt = referenceDate.toISOString();

  const plain = stripHtmlTags(html).replace(/\s+/g, " ");
  const hasTurmasTitle =
    /turmas?\s+(?:ofertadas?|abertas?).*(?:pr[oó]xim[oa]|seguinte)|pr[oó]xim[oa]\s+semestre|solicita[çc][ãa]o de abertura de turma|lista de solicita[çc][õo]es/i.test(
      plain
    );

  if (isPortalDiscenteHomeForTurmas(html) && !hasTurmasTitle) {
    return {
      scrapedAt,
      semestreAlvo,
      turmas: [],
      unavailable: true,
      unavailableReason:
        "Não foi possível abrir a lista de turmas do próximo semestre no SIGAA.",
    };
  }

  const tables = extractListagemTables(html);
  if (tables.length === 0) {
    return {
      scrapedAt,
      semestreAlvo,
      turmas: [],
      unavailable: true,
      unavailableReason: "Tabela de turmas ofertadas não encontrada.",
    };
  }

  let turmas: TurmaOfertadaItem[] = [];

  for (const tableHtml of tables) {
    if (isSolicitacaoTurmasTableHtml(tableHtml)) {
      turmas.push(...parseSolicitacaoTurmasTable(tableHtml, semestreAlvo));
      continue;
    }
    turmas.push(...parseLegacyListagemTable(tableHtml, semestreAlvo));
  }

  turmas = normalizeTurmasOfertadasItems(turmas);

  if (turmas.length === 0) {
    return {
      scrapedAt,
      semestreAlvo,
      turmas: [],
      unavailable: true,
      unavailableReason:
        "Não encontramos turmas Atendidas ou Pendentes na lista do SIGAA.",
    };
  }

  return {
    scrapedAt,
    semestreAlvo,
    turmas,
  };
}
