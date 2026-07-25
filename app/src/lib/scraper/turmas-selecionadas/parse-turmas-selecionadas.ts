import { stripHtmlTags } from "@/lib/scraper/turma-virtual/html-utils";
import { resolveDisciplinaCodigoByNome } from "@/lib/scraper/portal-discente/resolve-disciplina-codigo";

export interface TurmaSelecionadaItem {
  turmaCodigo: string | null;
  codigoDisciplina: string;
  sigaaComponente: string;
  nome: string;
  codigoHorario?: string | null;
  local?: string | null;
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
    const tableText = stripHtmlTags(table);
    if (/Turma/i.test(tableText) && (/(Comp\. Curricular|Disciplina)/i.test(tableText))) {
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
    let compCell = cells[1] ?? "";
    let nameCell = cells[2] ?? "";

    // Turma cell: "01 *" ou "01"
    const turmaCodigo = turmaCell.match(/^(\d+)/)?.[1] ?? null;

    let sigaaComponente = "";
    let nome = "";

    // Se a célula 1 tiver apenas um código curto sem espaços, e a célula 2 tiver texto, é o formato separado
    if (compCell && !/\s/.test(compCell) && nameCell.length > 5 && !/^\d+$/.test(nameCell)) {
      sigaaComponente = compCell.trim().toUpperCase();
      nome = nameCell.replace(/Docente\(s\):.*/i, "").trim();
    } else {
      // Formato junto: "G05AEDA2.02 ALGORITMOS E ESTRUTURAS DE DADOS II Docente(s):..."
      const compText = compCell.replace(/Docente\(s\):.*/i, "").trim();
      const match = compText.match(/^([A-Z0-9.]+)\s+[-–]?\s*(.+)$/i);
      
      if (match) {
        sigaaComponente = match[1].toUpperCase();
        nome = match[2].trim();
      } else {
        nome = compText;
      }
    }

    if (!nome && !sigaaComponente) continue;
    
    // Tentar achar o horário e o local nas outras células.
    // Padrão do horário: ex: "35M12 (05/08/2026 - 07/12/2026)" ou "4M34"
    let codigoHorario: string | null = null;
    let local: string | null = null;
    
    for (let i = 2; i < cells.length; i++) {
      const cellText = cells[i] || "";
      if (/[1-7]+[MTN][1-6]+/i.test(cellText)) {
        codigoHorario = cellText.split("(")[0].trim();
        // O local costuma vir logo na célula seguinte ao horário no SIGAA
        if (i + 1 < cells.length) {
          local = cells[i + 1].trim();
        }
        break;
      }
    }
    
    const codigoDisciplina = resolveDisciplinaCodigoByNome(nome) ?? sigaaComponente;

    turmas.push({
      turmaCodigo,
      codigoDisciplina: codigoDisciplina.toUpperCase(),
      sigaaComponente: sigaaComponente || codigoDisciplina.toUpperCase(),
      nome,
      codigoHorario,
      local,
    });
  }

  return turmas;
}
