import {
  parseFrequenciaPageHtml,
  parseMaxFaltasFromFrequenciaHtml,
} from "@/lib/scraper/turma-virtual/parse-frequencia-page";
import { parseGrupoPageHtml } from "@/lib/scraper/turma-virtual/parse-grupo-page";
import { parseNotasPageHtml } from "@/lib/scraper/turma-virtual/parse-notas-page";
import { parseTarefasListPageHtml } from "@/lib/scraper/turma-virtual/parse-tarefas-page";
import { stripHtmlTags } from "@/lib/scraper/turma-virtual/html-utils";
import type {
  TurmaVirtualDisciplinaRawPages,
  TurmaVirtualDisciplinaSnapshot,
} from "@/lib/scraper/types/turma-virtual";

function extractProfessorFromHtml(html: string | null): string | null {
  if (!html) return null;
  const plain = stripHtmlTags(html);
  const match = plain.match(/docente\s*:\s*([^|]+?)(?:\||$)/i);
  return match?.[1]?.trim() || null;
}

export function parseTurmaDisciplinaPages(
  raw: TurmaVirtualDisciplinaRawPages
): TurmaVirtualDisciplinaSnapshot {
  const warnings: string[] = [];
  const notasResult = raw.notasHtml
    ? parseNotasPageHtml(raw.notasHtml, { matricula: raw.matricula })
    : { notas: [], maxFaltas: null };
  if (raw.notasHtml && notasResult.notas.length === 0) {
    const hintsNotasTable =
      /nota|avalia|pro1|pro2|b1|m[eé]dia|tooltip/i.test(raw.notasHtml);
    if (hintsNotasTable) {
      warnings.push("notas não parseadas");
    }
  }
  if (!raw.notasHtml) warnings.push("notas indisponíveis");

  const faltas = raw.frequenciaHtml
    ? parseFrequenciaPageHtml(raw.frequenciaHtml)
    : [];
  if (!raw.frequenciaHtml) {
    warnings.push("frequência indisponível");
  } else if (faltas.length === 0) {
    // Espelho do aviso de notas: HTML chegou, mas o parser não extraiu linhas.
    // Sem isso, shouldReplaceSyncedFaltas apaga faltas sync antigas.
    const hintsFrequencia =
      /Mapa de Frequ|Frequ[eê]ncia|Presente|\d+\s+Falta|Faltou|N[aã]o\s+Registrad|\d{2}\/\d{2}\/\d{4}/i.test(
        raw.frequenciaHtml
      );
    if (hintsFrequencia) {
      warnings.push("frequência não parseada");
    }
  }

  const maxFaltasFromFreq = parseMaxFaltasFromFrequenciaHtml(raw.frequenciaHtml);
  const maxFaltas = maxFaltasFromFreq ?? notasResult.maxFaltas;

  const grupoParsed = raw.grupoHtml
    ? parseGrupoPageHtml(raw.grupoHtml)
    : { nomeGrupo: null, membros: [] };
  if (!raw.grupoHtml) warnings.push("grupo indisponível");

  const tarefas = raw.tarefasHtml
    ? parseTarefasListPageHtml(raw.tarefasHtml, raw.tarefaDetalhesHtml)
    : [];
  if (!raw.tarefasHtml) warnings.push("tarefas indisponíveis");

  const professor =
    extractProfessorFromHtml(raw.notasHtml) ??
    extractProfessorFromHtml(raw.tarefasHtml);

  return {
    sigaaNome: raw.sigaaNome,
    sigaaUrl: raw.sigaaUrl,
    professor,
    maxFaltas,
    notas: notasResult.notas,
    faltas,
    grupoNome: grupoParsed.nomeGrupo,
    grupo: grupoParsed.membros,
    tarefas,
    scrapeWarnings: warnings,
  };
}

export function assertTurmaVirtualSnapshot(
  snapshot: { disciplinas: TurmaVirtualDisciplinaSnapshot[] }
): void {
  if (snapshot.disciplinas.length === 0) {
    throw new Error("Nenhuma disciplina encontrada na turma virtual.");
  }
}
