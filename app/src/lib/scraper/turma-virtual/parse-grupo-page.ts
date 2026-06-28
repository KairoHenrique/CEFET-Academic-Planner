import {
  extractTableRowsFromHtml,
  findTableByHeader,
  normalizeHeader,
} from "@/lib/scraper/turma-virtual/html-utils";
import type { TurmaVirtualGrupoMembro } from "@/lib/scraper/types/turma-virtual";

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

export function parseGrupoPageHtml(html: string): TurmaVirtualGrupoMembro[] {
  const cards = parseSigaaGrupoCards(html);
  if (cards.length > 0) return cards;

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
