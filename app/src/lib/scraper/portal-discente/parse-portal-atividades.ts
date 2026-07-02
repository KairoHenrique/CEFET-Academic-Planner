import { stripHtmlTags } from "@/lib/scraper/turma-virtual/html-utils";
import { isPortalAtividadeEnviada } from "@/lib/scraper/portal-discente/parse-portal-atividade-status";
import type { PortalAtividadePendente } from "@/lib/scraper/types/portal-discente";

const BR_DATE_PATTERN = /(\d{2})\/(\d{2})\/(\d{4})/;
const ATIVIDADE_EXCLUDE_PATTERN =
  /nova\s+not[ií]cia|indica(?:ç|c)(?:ã|a)o\s+de\s+site|novo\s+t[oó]pico|últimas\s+atualiza|ultimas\s+atualiza|avalia(?:ç|c)(?:ã|a)o\s+marcada/i;

function parseBrDateToIso(value: string): string | null {
  const match = value.match(BR_DATE_PATTERN);
  if (!match) return null;
  return `${match[3]}-${match[2]}-${match[1]}`;
}

function inferTipoAtividade(text: string): PortalAtividadePendente["tipo"] {
  const normalized = text.toLowerCase();
  if (/em\s+dupla|em\s+grupo|tarefas?\s+em\s+grupo/.test(normalized)) return "grupo";
  if (normalized.includes("grupo")) return "grupo";
  if (normalized.includes("individual")) return "individual";
  return null;
}

function extractFormAtividadesSection(html: string): string | null {
  return html.match(/id=["']formAtividades["'][\s\S]*?<\/form>/i)?.[0] ?? null;
}

function parseAtividadeDateCell(cell: string): {
  dataFim: string | null;
  horaFim: string;
} {
  const plain = stripHtmlTags(cell);
  const dateMatch = plain.match(BR_DATE_PATTERN);
  const dataFim = dateMatch ? parseBrDateToIso(dateMatch[0]) : null;
  const horaFim = plain.match(/\b(\d{2}:\d{2})\b/)?.[1] ?? "23:59";
  return { dataFim, horaFim };
}

function parseAtividadeContentCell(cellHtml: string): {
  disciplinaNome: string;
  titulo: string;
  linkId: string | null;
  tipoLabel: string | null;
} | null {
  const linkMatch = cellHtml.match(
    /<a[^>]*id=["']([^"']*visualizar[^"']*)["'][^>]*>([\s\S]*?)<\/a>/i
  );
  if (!linkMatch) return null;

  const titulo = stripHtmlTags(linkMatch[2]).trim();
  if (!titulo) return null;

  const beforeLink = cellHtml.split(linkMatch[0])[0] ?? "";
  const disciplinaNome =
    stripHtmlTags(beforeLink.split(/<br\s*\/?>/i)[0] ?? beforeLink).trim() ||
    "DISCIPLINA";

  const tipoLabel =
    beforeLink.match(
      /<strong>\s*(Tarefa|Question[aá]rio|Avalia[cç][aã]o)\s*:?\s*<\/strong>/i
    )?.[1] ?? null;

  if (!tipoLabel) return null;

  return {
    disciplinaNome,
    titulo,
    linkId: linkMatch[1] ?? null,
    tipoLabel,
  };
}

/** Extrai atividades da tabela "Minhas atividades" do portal do discente. */
export function parsePortalAtividadesFromHtml(html: string): PortalAtividadePendente[] {
  const section = extractFormAtividadesSection(html);
  if (!section) return [];

  const atividades: PortalAtividadePendente[] = [];
  const seen = new Set<string>();
  const rowPattern = /<tr[^>]*class=["'][^"']*["'][^>]*>([\s\S]*?)<\/tr>/gi;
  let rowMatch = rowPattern.exec(section);

  while (rowMatch) {
    const rowHtml = rowMatch[1];
    rowMatch = rowPattern.exec(section);

    if (/colspan/i.test(rowHtml)) continue;

    const cells = Array.from(
      rowHtml.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)
    ).map((match) => match[1] ?? "");

    if (cells.length < 3) continue;

    const statusCell = cells[0] ?? "";
    const dateCell = cells[1] ?? "";
    const contentCell = cells[2] ?? "";
    const enviada = isPortalAtividadeEnviada(statusCell);
    const plainContent = stripHtmlTags(contentCell);

    if (ATIVIDADE_EXCLUDE_PATTERN.test(plainContent)) continue;

    const parsedContent = parseAtividadeContentCell(contentCell);
    if (!parsedContent) continue;

    const { dataFim, horaFim } = parseAtividadeDateCell(dateCell);
    if (!dataFim) continue;

    const dedupeKey = `${dataFim}:${parsedContent.titulo}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);

    atividades.push({
      disciplinaCodigo: parsedContent.disciplinaNome,
      titulo: parsedContent.titulo,
      dataFim,
      horaFim,
      tipo: inferTipoAtividade(plainContent),
      descricao: null,
      enviada,
      linkId: parsedContent.linkId,
      tipoLabel: parsedContent.tipoLabel,
      instrucoes: [],
      entregaveis: [],
    });
  }

  return atividades;
}
