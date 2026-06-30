import {
  extractTableRowsFromHtml,
  findTableByHeader,
  normalizeHeader,
  stripHtmlTags,
} from "@/lib/scraper/turma-virtual/html-utils";
import type {
  TurmaVirtualGrupoMembro,
  TurmaVirtualGrupoParseResult,
} from "@/lib/scraper/types/turma-virtual";

const GRUPO_NOME_STOP = /\s+N[uú]mero\s+de\s+Participantes\s*:/i;
const GRUPO_NOME_MAX_LENGTH = 120;

/** Corta lixo do SIGAA (participantes, membros, rodapé) colado no nome do grupo. */
export function sanitizeGrupoNome(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null;

  let nome = raw.replace(/\s+/g, " ").trim();
  const stopAt = nome.search(GRUPO_NOME_STOP);
  if (stopAt > 0) {
    nome = nome.slice(0, stopAt).trim();
  }

  if (!nome || nome.length > GRUPO_NOME_MAX_LENGTH) return null;
  if (/matr[ií]cula|sigaa|curso\s*:/i.test(nome)) return null;

  return nome;
}

function parseSigaaGrupoCards(html: string): TurmaVirtualGrupoMembro[] {
  const membros: TurmaVirtualGrupoMembro[] = [];
  const cardPattern =
    /<strong>\s*([^<]+?)\s*<\/strong>[\s\S]*?Curso:\s*<em>([^<]*)<\/em>[\s\S]*?Matr[ií]cula:\s*<em>(\d+)<\/em>[\s\S]*?E-mail:\s*<em>([^<]*)<\/em>/gi;

  let match = cardPattern.exec(html);
  while (match) {
    membros.push({
      nome: match[1].trim(),
      curso: match[2].trim() || null,
      matricula: match[3].trim(),
      email: match[4].trim() || null,
    });
    match = cardPattern.exec(html);
  }

  return membros;
}

export function parseGrupoNomeFromHtml(html: string): string | null {
  const labeledHtml = html.match(
    /(?:<b>|<strong>)\s*Nome\s+do\s+Grupo\s*:?\s*(?:<\/b>|<\/strong>)\s*([^<]+)/i
  );
  if (labeledHtml?.[1]) {
    const nome = sanitizeGrupoNome(stripHtmlTags(labeledHtml[1]));
    if (nome) return nome;
  }

  const plain = stripHtmlTags(html).replace(/\s+/g, " ");
  const inline = plain.match(
    /Nome\s+do\s+Grupo\s*:\s*(.+?)(?=\s+N[uú]mero\s+de\s+Participantes\s*:|$)/i
  );
  if (inline?.[1]) {
    const nome = sanitizeGrupoNome(inline[1]);
    if (nome) return nome;
  }

  return null;
}

function parseSigaaGrupoTable(html: string): TurmaVirtualGrupoMembro[] {
  const rows = extractTableRowsFromHtml(html);
  const table = findTableByHeader(rows, [/nome/i, /matric/i]);
  if (!table) return [];

  const headers = table[0].map(normalizeHeader);
  const nomeIndex = headers.findIndex((cell) => cell.includes("nome"));
  const matriculaIndex = headers.findIndex((cell) => cell.includes("matric"));
  const emailIndex = headers.findIndex(
    (cell) => cell.includes("email") || cell.includes("e-mail")
  );
  const cursoIndex = headers.findIndex((cell) => cell.includes("curso"));

  if (nomeIndex < 0) return [];

  const membros: TurmaVirtualGrupoMembro[] = [];

  for (const row of table.slice(1)) {
    const nome = row[nomeIndex]?.trim();
    if (!nome || /^total|^nenhum/i.test(nome)) continue;

    membros.push({
      nome,
      matricula: matriculaIndex >= 0 ? row[matriculaIndex]?.trim() || null : null,
      email: emailIndex >= 0 ? row[emailIndex]?.trim() || null : null,
      curso: cursoIndex >= 0 ? row[cursoIndex]?.trim() || null : null,
    });
  }

  return membros;
}

export function parseGrupoPageHtml(html: string): TurmaVirtualGrupoParseResult {
  const nomeGrupo = parseGrupoNomeFromHtml(html);
  const cards = parseSigaaGrupoCards(html);
  const membros = cards.length > 0 ? cards : parseSigaaGrupoTable(html);

  return { nomeGrupo, membros };
}
