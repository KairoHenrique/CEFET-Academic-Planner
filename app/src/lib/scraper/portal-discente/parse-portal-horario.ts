import { parseBrDateToIso, stripHtmlTags } from "@/lib/scraper/turma-virtual/html-utils";
import type { PortalDisciplinaSemestre } from "@/lib/scraper/types/portal-discente";

import {
  extractHorarioCodigoFromText,
} from "@/lib/schedule/parse-sigaa-codigo";

const SEMESTRE_HEADER_PATTERN = /(\d{4}\.\d)/;

function normalizeNomeKey(nome: string): string {
  return nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function extractHorarioCodigo(value: string): string | null {
  return extractHorarioCodigoFromText(value);
}

export function extractTurmaPeriodFromHorarioText(
  text: string
): { dataInicio: string; dataFim: string } | null {
  const match = text.match(/(\d{2}\/\d{2}\/\d{4})\s*[-–]\s*(\d{2}\/\d{2}\/\d{4})/);
  if (!match) return null;

  const dataInicio = parseBrDateToIso(match[1]);
  const dataFim = parseBrDateToIso(match[2]);
  if (!dataInicio || !dataFim) return null;

  return { dataInicio, dataFim };
}

function extractLocalFromRow(rowHtml: string): string | null {
  const infoCells = Array.from(
    rowHtml.matchAll(/<td[^>]*class=["']info["'][^>]*>([\s\S]*?)<\/td>/gi)
  ).map((match) => stripHtmlTags(match[1] ?? ""));

  for (const cell of infoCells) {
    const room = cell.match(/\b(\d{2,3}(?:\/\d{2,3})?)\b/);
    if (room?.[1]) return room[1];
  }

  return null;
}

const SKIP_DISCIPLINA_NOME =
  /^(mensagens|atualizar|perfil|sair|dossie|caixa\s+postal|componente\s+curricular)$/i;

function extractHorarioTableSection(html: string): string {
  const matches = html.match(
    /Componente\s+Curricular[\s\S]*?<\/table>/gi
  );
  if (!matches) return html;
  
  // O SIGAA possui itens de menu ocultos (JSF) que tambm contm "Componente Curricular".
  // A tabela verdadeira de horrios sempre contm <td class="descricao">.
  return matches.find(m => m.includes("descricao") || m.includes("Turmas")) ?? matches[matches.length - 1];
}

/** Infere o semestre letivo (ex.: 2026.1) a partir do HTML do portal. */
export function inferSemestreAtualFromHtml(html: string): string | null {
  const section = extractHorarioTableSection(html);
  const header = section.match(
    /<td[^>]*colspan[^>]*>[\s\S]*?(\d{4}\.\d)[\s\S]*?<\/td>/i
  );
  if (header?.[1]) return header[1];

  const fromLink = html.match(/\((\d{4}\.\d)\)\s*<\/a>/i);
  if (fromLink?.[1]) return fromLink[1];

  const plain = stripHtmlTags(html);
  const match = plain.match(SEMESTRE_HEADER_PATTERN);
  return match?.[1] ?? null;
}

/**
 * Extrai disciplinas do quadro de horários do portal (fonte canônica).
 * Aceita qualquer nome — curto (FÍSICA, CÁLC) ou longo.
 */
export function parseDisciplinasHorarioFromHtml(
  html: string
): PortalDisciplinaSemestre[] {
  const disciplinas = new Map<string, PortalDisciplinaSemestre>();
  const section = extractHorarioTableSection(html);
  const rowPattern =
    /<tr[^>]*>[\s\S]*?<td[^>]*class=["']descricao["'][\s\S]*?<\/tr>/gi;

  let rowMatch = rowPattern.exec(section);
  while (rowMatch) {
    const rowHtml = rowMatch[0];
    rowMatch = rowPattern.exec(section);

    if (!/form_acessarTurmaVirtual/i.test(rowHtml)) continue;
    if (!/frontEndIdTurma/i.test(rowHtml)) continue;

    const anchorMatch = rowHtml.match(
      /<a[^>]*onclick="[^"]*frontEndIdTurma[^"]*"[^>]*>([\s\S]*?)<\/a>/i
    );
    const nome = stripHtmlTags(anchorMatch?.[1] ?? "").trim();
    if (!nome || nome.length < 2 || SKIP_DISCIPLINA_NOME.test(nome)) continue;

    const horarioRaw = stripHtmlTags(rowHtml);
    const codigoHorario = extractHorarioCodigo(horarioRaw);
    if (!codigoHorario) continue;

    const turmaPeriod = extractTurmaPeriodFromHorarioText(horarioRaw);

    disciplinas.set(normalizeNomeKey(nome), {
      codigo: nome,
      nome,
      local: extractLocalFromRow(rowHtml),
      codigoHorario,
      horarioTraduzido: null,
      turmaDataInicio: turmaPeriod?.dataInicio ?? null,
      turmaDataFim: turmaPeriod?.dataFim ?? null,
    });
  }

  return Array.from(disciplinas.values());
}
