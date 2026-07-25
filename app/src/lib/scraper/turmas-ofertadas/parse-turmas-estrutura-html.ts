import { extractHorarioCodigo } from "@/lib/scraper/portal-discente/parse-portal-horario";
import { resolveNextAcademicSemesterLabel } from "@/lib/academic/resolve-academic-semester";
import { stripHtmlTags } from "@/lib/scraper/turma-virtual/html-utils";
import type {
  TurmaOfertadaItem,
  TurmaOfertadaRequisitoItem,
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
  
  const internalIdMap = new Map<string, string>();
  const rawRequisitos: { internalIdTarget: string, expr: string, tipoStr: string }[] = [];

  const rowPattern = /<tr[^>]*class=["']([^"']*)["'][^>]*>([\s\S]*?)<\/tr>/gi;
  let match;

  while ((match = rowPattern.exec(tbody)) !== null) {
    const className = match[1] || "";
    const rowHtml = match[2];

    if (className.includes("periodo")) continue;

    if (className.includes("disciplina")) {
      const cells = Array.from(rowHtml.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi));
      if (cells.length >= 2) {

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

        const painelMatch = cells[1][1].match(/PainelComponente\.show\((\d+)/i);
        const internalIdTarget = painelMatch ? painelMatch[1] : null;

        if (internalIdTarget && currentCodigoDisciplina) {
          internalIdMap.set(internalIdTarget, currentCodigoDisciplina);
        }

        const reqCell = cells[cells.length - 1]?.[1] || "";
        const reqMatchAll = reqCell.matchAll(/PainelConsultaTurmas\.show\('([^']+)'\s*,\s*'([^']+)'\)/gi);
        for (const rMatch of reqMatchAll) {
          if (internalIdTarget) {
            rawRequisitos.push({
              internalIdTarget,
              expr: rMatch[1],
              tipoStr: rMatch[2]
            });
          }
        }
      }
      continue;
    }

    if (className.includes("linhaPar") || className.includes("linhaImpar")) {
      if (!currentCodigoDisciplina || !currentNomeDisciplina) continue;

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
        sigaaComponente: currentCodigoDisciplina,
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

  const requisitos: TurmaOfertadaRequisitoItem[] = [];
  
  for (const raw of rawRequisitos) {
    const disciplinaCodigo = internalIdMap.get(raw.internalIdTarget);
    if (!disciplinaCodigo) continue;

    // Apenas pre-requisitos e co-requisitos (ignoramos equivalentes por enquanto)
    if (!raw.tipoStr.toLowerCase().includes("requisito")) continue;

    const tipo: "pre" | "co" = raw.tipoStr.toLowerCase().includes("co-req") ? "co" : "pre";
    
    // Expressões comuns: "( ( 5128 E 3850 ) )"
    const requiredIds = Array.from(raw.expr.matchAll(/\d+/g)).map(m => m[0]);
    
    for (const reqId of requiredIds) {
      const requisitoCodigo = internalIdMap.get(reqId);
      if (requisitoCodigo) {
        requisitos.push({
          disciplinaCodigo,
          requisitoCodigo,
          tipo
        });
      }
    }
  }

  return {
    scrapedAt,
    semestreAlvo,
    turmas,
    requisitos,
  };
}
