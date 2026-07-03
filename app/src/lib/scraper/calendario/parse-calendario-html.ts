import {
  isAcademicCalendarTableHeader,
  isImportantCalendarioEventoLabel,
  isPortalDiscenteHomeHtml,
  isUndefinedCalendarioValue,
  isValidCalendarioEventoLabel,
  stripNonContentHtml,
} from "@/lib/scraper/calendario/calendario-event-filter";
import type {
  CalendarioAcademicoEvento,
  CalendarioAcademicoSnapshot,
} from "@/lib/scraper/types/calendario";

const SEMESTRE_LABEL = /\b(20\d{2})\s*[\.\/]\s*([12])\b/;

function parseBrDateToIso(day: string, month: string, year: string): string {
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

export function parseCalendarioDateRange(
  raw: string,
  fallbackYear: string
): { dataInicio: string; dataFim: string | null } | null {
  const text = raw
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^de\s+/i, "");

  if (!text) return null;
  if (/\b\d{1,2}[MTNJ]\d{2}\b/i.test(text)) return null;

  const rangeMatch = text.match(
    /(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?\s*(?:a|at[eé]|–|-)\s*(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?/i
  );

  if (rangeMatch) {
    const startYear = rangeMatch[3] ?? fallbackYear;
    const endYear = rangeMatch[6] ?? startYear;
    return {
      dataInicio: parseBrDateToIso(rangeMatch[1], rangeMatch[2], startYear),
      dataFim: parseBrDateToIso(rangeMatch[4], rangeMatch[5], endYear),
    };
  }

  const singleMatch = text.match(/(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?/);
  if (!singleMatch) return null;

  const year = singleMatch[3] ?? fallbackYear;
  return {
    dataInicio: parseBrDateToIso(singleMatch[1], singleMatch[2], year),
    dataFim: null,
  };
}

function extractSemestreFromDetailHtml(html: string): string | null {
  const match = html.match(
    /Ano\s*[\/\-]?\s*Semestre[\s\S]{0,120}?(\d{4})\s*[\/\.\-]\s*([12])/i
  );
  if (match) return `${match[1]}.${match[2]}`;
  return extractSemestreFromText(html);
}

function extractSemestreFromText(text: string): string | null {
  const match = text.match(SEMESTRE_LABEL);
  if (!match) return null;
  return `${match[1]}.${match[2]}`;
}

function normalizeEventoLabel(value: string): string {
  return value.replace(/\s+/g, " ").replace(/:$/, "").trim();
}

function shouldKeepCalendarioEvento(evento: string, dateRaw: string): boolean {
  if (isUndefinedCalendarioValue(dateRaw)) return false;
  if (!isValidCalendarioEventoLabel(evento)) return false;
  return isImportantCalendarioEventoLabel(evento);
}

function isExcludedInstitutionalTable(cells: string[]): boolean {
  const joined = cells.join(" ").toLowerCase();
  return (
    /componente curricular|hor[aá]rio|local/.test(joined) ||
    /t[ií]tulo|autor|respostas/.test(joined)
  );
}

/** SIGAA detalhe: Período Letivo | De 02/03/2026 até 06/07/2026 */
function parseLabelValueRows(
  html: string,
  semestre: string
): CalendarioAcademicoEvento[] {
  const rowPattern = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  const cellPattern = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
  const events: CalendarioAcademicoEvento[] = [];
  const yearFromSemestre =
    semestre.split(".")[0] ?? String(new Date().getFullYear());

  let rowMatch: RegExpExecArray | null;
  while ((rowMatch = rowPattern.exec(html)) !== null) {
    const cells: string[] = [];
    let cellMatch: RegExpExecArray | null;
    while ((cellMatch = cellPattern.exec(rowMatch[1])) !== null) {
      const text = cellMatch[1]
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/gi, " ")
        .replace(/\s+/g, " ")
        .trim();
      if (text) cells.push(text);
    }

    if (cells.length < 2 || isExcludedInstitutionalTable(cells)) continue;

    const evento = normalizeEventoLabel(cells[0]);
    const dateRaw = cells.slice(1).join(" ");
    const parsed = parseCalendarioDateRange(dateRaw, yearFromSemestre);

    if (!evento || !parsed || !shouldKeepCalendarioEvento(evento, dateRaw)) continue;

    events.push({
      evento,
      dataInicio: parsed.dataInicio,
      dataFim: parsed.dataFim,
      semestre,
    });
  }

  return events;
}

function parseEventTableRows(
  html: string,
  semestre: string
): CalendarioAcademicoEvento[] {
  const tablePattern = /<table[^>]*>([\s\S]*?)<\/table>/gi;
  const rowPattern = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  const cellPattern = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
  const events: CalendarioAcademicoEvento[] = [];
  const yearFromSemestre =
    semestre.split(".")[0] ?? String(new Date().getFullYear());

  let tableMatch: RegExpExecArray | null;
  while ((tableMatch = tablePattern.exec(html)) !== null) {
    const tableHtml = tableMatch[1];
    let isCalendarioTable = false;

    let rowMatch: RegExpExecArray | null;
    while ((rowMatch = rowPattern.exec(tableHtml)) !== null) {
      const cells: string[] = [];
      let cellMatch: RegExpExecArray | null;
      while ((cellMatch = cellPattern.exec(rowMatch[1])) !== null) {
        const text = cellMatch[1]
          .replace(/<[^>]+>/g, " ")
          .replace(/&nbsp;/gi, " ")
          .replace(/\s+/g, " ")
          .trim();
        if (text) cells.push(text);
      }

      if (cells.length === 0) continue;

      if (isAcademicCalendarTableHeader(cells)) {
        isCalendarioTable = true;
        continue;
      }

      if (!isCalendarioTable || cells.length < 2) continue;

      const evento = normalizeEventoLabel(cells[0]);
      const dateRaw = cells.slice(1).join(" ");
      const parsed = parseCalendarioDateRange(dateRaw, yearFromSemestre);

      if (!evento || !parsed || !shouldKeepCalendarioEvento(evento, dateRaw)) continue;

      events.push({
        evento,
        dataInicio: parsed.dataInicio,
        dataFim: parsed.dataFim,
        semestre,
      });
    }
  }

  return events;
}

function dedupeEventos(
  eventos: CalendarioAcademicoEvento[]
): CalendarioAcademicoEvento[] {
  const seen = new Set<string>();
  return eventos.filter((item) => {
    const key = `${item.semestre ?? ""}|${item.evento.toLowerCase()}|${item.dataInicio}|${item.dataFim ?? ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function parseCalendarioHtml(
  html: string,
  options: {
    semestreAlvo: string[];
    semestreContext?: string;
    scrapedAt?: string;
  }
): CalendarioAcademicoSnapshot {
  const scrapedAt = options.scrapedAt ?? new Date().toISOString();

  if (isPortalDiscenteHomeHtml(html)) {
    return {
      scrapedAt,
      semestreAlvo: options.semestreAlvo,
      eventos: [],
      unavailable: true,
      unavailableReason:
        "HTML do portal discente (turmas) — não é calendário institucional.",
    };
  }

  const sanitized = stripNonContentHtml(html);
  const bodySemestre =
    options.semestreContext ??
    extractSemestreFromDetailHtml(sanitized) ??
    extractSemestreFromText(sanitized) ??
    options.semestreAlvo[0] ??
    null;
  const semestre =
    bodySemestre ?? options.semestreAlvo[0] ?? `${new Date().getFullYear()}.1`;

  const fromLabelValue = parseLabelValueRows(sanitized, semestre);
  const fromEventTable = parseEventTableRows(sanitized, semestre);
  const unique = dedupeEventos([...fromLabelValue, ...fromEventTable]);

  return {
    scrapedAt,
    semestreAlvo: options.semestreAlvo,
    eventos: unique,
    unavailable: unique.length === 0,
    unavailableReason:
      unique.length === 0
        ? "Nenhum evento institucional encontrado no HTML."
        : undefined,
  };
}
