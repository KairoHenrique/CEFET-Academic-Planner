import { extractHorarioCodigo } from "@/lib/scraper/portal-discente/parse-portal-horario";
import { resolveNextAcademicSemesterLabel } from "@/lib/academic/resolve-academic-semester";
import { stripHtmlTags } from "@/lib/scraper/turma-virtual/html-utils";
import type {
  TurmaOfertadaItem,
  TurmasOfertadasSnapshot,
} from "@/lib/scraper/types/turmas-ofertadas";

export interface ParseTurmasEstruturaOptions {
  referenceDate?: Date;
}

export function parseTurmasEstruturaHtml(
  html: string,
  options?: ParseTurmasEstruturaOptions
): TurmasOfertadasSnapshot {
  const referenceDate = options?.referenceDate ?? new Date();
  const semestreAlvo = resolveNextAcademicSemesterLabel(referenceDate);
  const scrapedAt = referenceDate.toISOString();

  const tableMatch = html.match(/<table[^>]*id=["']lista-turmas-curriculo["'][^>]*>([\s\S]*?)<\/table>/i);

  if (!tableMatch) {
    return {
      scrapedAt,
      semestreAlvo,
      turmas: [],
      unavailable: true,
      unavailableReason: "Tabela lista-turmas-curriculo não encontrada.",
    };
  }

  const turmas: TurmaOfertadaItem[] = [];
  const tbodyMatch = tableMatch[1].match(/<tbody[^>]*>([\s\S]*?)<\/tbody>/i);
  const tbody = tbodyMatch ? tbodyMatch[1] : tableMatch[1];
  
  let currentCodigoDisciplina: string | null = null;
  let currentNomeDisciplina: string | null = null;
  let isPermitida = false;

  const rowPattern = /<tr[^>]*class=["']([^"']*)["'][^>]*>([\s\S]*?)<\/tr>/gi;
  let match;

  while ((match = rowPattern.exec(tbody)) !== null) {
    const className = match[1] || "";
    const rowHtml = match[2];

    if (className.includes("periodo")) continue;

    if (className.includes("disciplina")) {
      const cells = Array.from(rowHtml.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi));
      if (cells.length >= 2) {
        const permitidaCell = cells[0][1];
        isPermitida = permitidaCell.includes("matricula_permitida");

        const anchorMatch = cells[1][1].match(/<a[^>]*>([\s\S]*?)<\/a>/i);
        const anchorText = stripHtmlTags(anchorMatch ? anchorMatch[1] : cells[1][1]).trim();
        
        const discMatch = anchorText.match(/(?:\*\s*)?([A-Z0-9.-]+)\s*-\s*(.+)/i);
        if (discMatch) {
          currentCodigoDisciplina = discMatch[1].trim();
          currentNomeDisciplina = discMatch[2].trim();
        } else {
          currentCodigoDisciplina = anchorText.substring(0, 10).trim();
          currentNomeDisciplina = anchorText;
        }
      }
      continue;
    }

    if (className.includes("linhaPar") || className.includes("linhaImpar")) {
      if (!currentCodigoDisciplina || !currentNomeDisciplina || !isPermitida) continue;

      const cells = Array.from(rowHtml.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)).map(m => stripHtmlTags(m[1]).replace(/\s+/g, " ").trim());
      if (cells.length < 7) continue;

      const turmaCodigoLabel = cells[3] || "";
      const turmaCodigo = turmaCodigoLabel.replace(/Turma/i, "").trim();

      const professor = cells[4] || null;
      
      const horarioExibicaoFull = cells[5] || "";
      const horarioExibicao = horarioExibicaoFull.split("(")[0].trim();
      const codigoHorario = extractHorarioCodigo(horarioExibicao);
      if (!codigoHorario) continue;

      const local = cells[6] || null;

      turmas.push({
        turmaSigaaId: `${semestreAlvo}:${currentCodigoDisciplina}:${turmaCodigo}:${codigoHorario}`,
        sigaaComponente: null,
        codigoDisciplina: currentCodigoDisciplina,
        nome: currentNomeDisciplina,
        turmaCodigo,
        semestre: semestreAlvo,
        codigoHorario,
        horarioExibicao,
        local: local || null,
        professor: professor || null,
        vagas: null,
        vagasOcupadas: null,
        cargaHoraria: null,
        situacao: "atendida",
        tipoTurma: "Turma Regular",
        departamento: null,
        horarioIndefinido: false,
      });
    }
  }

  return {
    scrapedAt,
    semestreAlvo,
    turmas,
  };
}
