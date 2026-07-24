import { stripHtmlTags } from "@/lib/scraper/turma-virtual/html-utils";
import { resolveDisciplinaCodigoByNome } from "@/lib/scraper/portal-discente/resolve-disciplina-codigo";

export interface TurmaSelecionadaItem {
  turmaCodigo: string | null;
  codigoDisciplina: string;
  nome: string;
}

function extractRowCells(rowHtml: string): string[] {
  return Array.from(
    rowHtml.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)
  ).map((match) => stripHtmlTags(match[1] ?? "").replace(/\s+/g, " ").trim());
}

export function parseTurmasSelecionadasTableHtml(html: string): TurmaSelecionadaItem[] {
  const tables = Array.from(
    html.matchAll(/<table[^>]*class=["'][^"']*listagem[^"']*["'][\s\S]*?<\/table>/gi)
  ).map((match) => match[0]);

  let targetTable = "";
  for (const table of tables) {
    if (/Turma.*Comp\. Curricular.*CH.*A[çc][õo]es/i.test(stripHtmlTags(table))) {
      targetTable = table;
      break;
    }
  }

  if (!targetTable) return [];

  const turmas: TurmaSelecionadaItem[] = [];
  const rowPattern = /<tr[^>]*>[\s\S]*?<\/tr>/gi;
  let rowMatch = rowPattern.exec(targetTable);

  while (rowMatch) {
    const rowHtml = rowMatch[0];
    rowMatch = rowPattern.exec(targetTable);

    if (/<th[\s>]/i.test(rowHtml)) continue;

    const cells = extractRowCells(rowHtml);
    if (cells.length < 3) continue;

    const turmaCell = cells[0] ?? "";
    const compCell = cells[1] ?? "";

    // Turma cell: "01 *" ou "01"
    const turmaCodigo = turmaCell.match(/^(\d+)/)?.[1] ?? null;

    // Comp. Curricular cell: "G05AEDA2.02 ALGORITMOS E ESTRUTURAS DE DADOS II Docente(s): MICHEL PIRES DA SILVA"
    const compText = compCell.replace(/Docente\(s\):.*/i, "").trim();
    const match = compText.match(/^([A-Z0-9.]+)\s*[-–]?\s*(.+)$/i);
    
    let sigaaComponente = "";
    let nome = "";
    if (match) {
      sigaaComponente = match[1].toUpperCase();
      nome = match[2].trim();
    } else {
      nome = compText;
    }

    if (!nome && !sigaaComponente) continue;
    
    const codigoDisciplina = resolveDisciplinaCodigoByNome(nome) ?? sigaaComponente;

    turmas.push({
      turmaCodigo,
      codigoDisciplina: codigoDisciplina.toUpperCase(),
      nome,
    });
  }

  return turmas;
}
