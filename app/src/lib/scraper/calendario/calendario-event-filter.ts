/** Palavras típicas de eventos institucionais — não de disciplinas. */
const INSTITUTIONAL_KEYWORDS =
  /in[ií]cio|fim\s+das?\s+aulas|recesso|prova|matr[ií]cula|trancamento|rematr[ií]cula|feriado|cola[cç][aã]o|enade|avalia[cç][aã]o|per[ií]odo|semestre|calend[aá]rio|divulga[cç][aã]o|resultado/i;

/** Eventos que realmente importam para o aluno (detalhe SIGAA). */
const IMPORTANT_CALENDARIO_EVENT =
  /^(per[ií]odo letivo|matr[ií]cula on\s?line|matr[ií]cula extraordin[aá]ria|rematr[ií]cula|ajustes das rematr[ií]culas\/turmas|ajustes das matr[ií]culas\/turmas|recesso|provas finais|in[ií]cio das aulas|trancamento)$/i;

export function isUndefinedCalendarioValue(raw: string): boolean {
  const text = raw.replace(/\s+/g, " ").trim().toLowerCase();
  return (
    text.length === 0 ||
    /^n[aã]o\s+definido\.?$/i.test(text) ||
    /^indefinido\.?$/i.test(text) ||
    text === "não" ||
    text === "nao" ||
    text === "-" ||
    text === "—"
  );
}

export function isImportantCalendarioEventoLabel(evento: string): boolean {
  const label = evento.replace(/\s+/g, " ").replace(/:$/, "").trim();
  return IMPORTANT_CALENDARIO_EVENT.test(label);
}

const HORARIO_SIGAA = /\b\d{1,2}[MTNJ]\d{2}\b/i;
const SCRIPT_GARBAGE =
  /function\s*\(|=>|JAWR|generateCookie|document\.|window\.|RICH_FACES|YAHOO|STICookie|addListener|loader\.(script|style)|\.jsf|http:\/\/|https:\/\/|var\s+\w+|true;|false;/i;

export function isPortalDiscenteHomeHtml(html: string): boolean {
  return /Turmas do Semestre|Componente Curricular|Dados Institucionais/i.test(
    html
  );
}

export function isAcademicCalendarTableHeader(cells: string[]): boolean {
  const joined = cells.join(" ").toLowerCase();
  const hasEventCol = /evento|atividade|ocorr[eê]ncia|descri[cç][aã]o/.test(
    joined
  );
  const hasDateCol = /data|per[ií]odo|prazo|vig[eê]ncia/.test(joined);
  const isTurmaTable = /componente curricular|hor[aá]rio|local/.test(joined);
  const isForum = /t[ií]tulo|autor|respostas/.test(joined);
  return hasEventCol && hasDateCol && !isTurmaTable && !isForum;
}

export function isDisciplineLikeLabel(evento: string): boolean {
  const label = evento.replace(/\s+/g, " ").trim();
  if (label.length < 12) return false;

  const letters = label.replace(/[^a-zA-ZÀ-ú]/g, "");
  const upper = label.replace(/[^A-ZÀ-Ú]/g, "");
  if (letters.length < 10) return false;

  const upperRatio = upper.length / letters.length;
  return upperRatio > 0.82 && !INSTITUTIONAL_KEYWORDS.test(label);
}

export function isValidCalendarioEventoLabel(evento: string): boolean {
  const label = evento.replace(/\s+/g, " ").trim();
  if (label.length < 3 || label.length > 90) return false;
  if (SCRIPT_GARBAGE.test(label)) return false;
  if (/[{}]/.test(label)) return false;
  if (HORARIO_SIGAA.test(label)) return false;
  if (/^SIGAA\b/i.test(label)) return false;
  if (isDisciplineLikeLabel(label)) return false;
  if (/^coordenador de/i.test(label) && !INSTITUTIONAL_KEYWORDS.test(label)) {
    return false;
  }
  return true;
}

export function isValidCalendarioIsoDate(iso: string): boolean {
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return false;
  const month = Number(match[2]);
  const day = Number(match[3]);
  return month >= 1 && month <= 12 && day >= 1 && day <= 31;
}

export function stripNonContentHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<head[\s\S]*?<\/head>/gi, " ");
}
