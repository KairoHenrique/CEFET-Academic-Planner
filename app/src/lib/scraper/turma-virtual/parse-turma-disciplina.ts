import { parseFrequenciaPageHtml } from "@/lib/scraper/turma-virtual/parse-frequencia-page";
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
    ? parseNotasPageHtml(raw.notasHtml)
    : { notas: [], maxFaltas: null };
  if (!raw.notasHtml) warnings.push("notas indisponíveis");

  const faltas = raw.frequenciaHtml
    ? parseFrequenciaPageHtml(raw.frequenciaHtml)
    : [];
  if (!raw.frequenciaHtml) warnings.push("frequência indisponível");

  const grupo = raw.grupoHtml ? parseGrupoPageHtml(raw.grupoHtml) : [];
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
    maxFaltas: notasResult.maxFaltas,
    notas: notasResult.notas,
    faltas,
    grupo,
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
