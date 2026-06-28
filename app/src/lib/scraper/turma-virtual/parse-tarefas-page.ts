import {
  extractLinkHrefs,
  extractTableRowsFromHtml,
  findTableByHeader,
  normalizeHeader,
  parseBrDateToIso,
  parseBrDecimal,
  stripHtmlTags,
} from "@/lib/scraper/turma-virtual/html-utils";
import type { TurmaVirtualTarefa } from "@/lib/scraper/types/turma-virtual";

const PERIOD_PATTERN =
  /(\d{2}\/\d{2}\/\d{4})(?:\s*(?:-|–|a)\s*(\d{2}\/\d{2}\/\d{4}))?(?:\s+(\d{2}:\d{2}))?/;

function inferTipoTarefa(text: string): TurmaVirtualTarefa["tipo"] {
  const normalized = normalizeHeader(text);
  if (normalized.includes("grupo")) return "grupo";
  if (normalized.includes("individual")) return "individual";
  return null;
}

function parsePossuiNotaCell(value: string): {
  possuiNota: boolean;
  pontuacaoMaxima: number | null;
} {
  const normalized = normalizeHeader(value);
  if (!normalized || normalized === "nao" || normalized === "não") {
    return { possuiNota: false, pontuacaoMaxima: null };
  }

  const maxMatch = value.match(/\(([\d,.]+)\)/);
  return {
    possuiNota: true,
    pontuacaoMaxima: maxMatch ? parseBrDecimal(maxMatch[1]) : null,
  };
}

function parsePeriodoCell(value: string): {
  dataInicio: string | null;
  dataFim: string | null;
  horaFim: string | null;
} {
  const match = value.match(PERIOD_PATTERN);
  if (!match) {
    return { dataInicio: null, dataFim: null, horaFim: null };
  }

  const dataInicio = parseBrDateToIso(match[1]);
  const dataFim = match[2] ? parseBrDateToIso(match[2]) : dataInicio;
  return {
    dataInicio,
    dataFim,
    horaFim: match[3] ?? "23:59",
  };
}

function parseBulletList(html: string, labelPattern: RegExp): string[] {
  const sectionMatch = html.match(
    new RegExp(`${labelPattern.source}[\\s\\S]*?(<ul[\\s\\S]*?</ul>)`, "i")
  );
  if (!sectionMatch) return [];

  const items = sectionMatch[1].match(/<li[^>]*>([\s\S]*?)<\/li>/gi) ?? [];
  return items
    .map((item) => stripHtmlTags(item))
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseTarefaDetalheHtml(html: string): Pick<
  TurmaVirtualTarefa,
  "descricao" | "instrucoes" | "entregaveis" | "downloadUrls"
> {
  const descricaoMatch = html.match(
    /descri[cç][aã]o[\s:]*([\s\S]*?)(?:instru|<\/table>|entreg|<ul|$)/i
  );
  const descricao = descricaoMatch
    ? stripHtmlTags(descricaoMatch[1]).slice(0, 4000).trim() || null
    : null;

  return {
    descricao,
    instrucoes: parseBulletList(html, /instru[cç][oõ]es?/i),
    entregaveis: parseBulletList(html, /entreg[aá]veis?/i),
    downloadUrls: extractLinkHrefs(html)
      .filter((link) => /\.(pdf|doc|docx|zip|rar)$/i.test(link.href))
      .map((link) => link.href),
  };
}

const SIGAA_PERIODO_PATTERN =
  /de\s+(\d{2}\/\d{2}\/\d{4})\s+às\s+(\d{1,2})h(\d{0,2})\s+a\s+(\d{2}\/\d{2}\/\d{4})\s+às\s+(\d{1,2})h(\d{0,2})/i;

function parseSigaaTarefasListHtml(html: string): TurmaVirtualTarefa[] {
  const plain = stripHtmlTags(html);
  const tarefas: TurmaVirtualTarefa[] = [];
  const sections: Array<{ tipo: TurmaVirtualTarefa["tipo"]; chunk: string }> = [
    {
      tipo: "individual",
      chunk: plain.split(/Tarefas Em Grupo/i)[0] ?? plain,
    },
    {
      tipo: "grupo",
      chunk: plain.split(/Tarefas Em Grupo/i)[1] ?? "",
    },
  ];

  for (const section of sections) {
    if (!section.chunk.trim()) continue;

    const rowPattern =
      /([A-Za-zÀ-ú0-9][^\n\t]{2,120}?)\s+de\s+\d{2}\/\d{2}\/\d{4}\s+às\s+\d{1,2}h\d{0,2}\s+a\s+\d{2}\/\d{2}\/\d{4}\s+às\s+\d{1,2}h\d{0,2}\s+(Sim|N[aã]o)/gi;
    let match = rowPattern.exec(section.chunk);

    while (match) {
      const titulo = match[1].trim();
      const periodoMatch = match[0].match(SIGAA_PERIODO_PATTERN);
      const dataInicio = periodoMatch
        ? parseBrDateToIso(periodoMatch[1])
        : null;
      const dataFim = periodoMatch ? parseBrDateToIso(periodoMatch[4]) : null;
      const horaFim = periodoMatch
        ? `${periodoMatch[5].padStart(2, "0")}:${(periodoMatch[6] || "0").padStart(2, "0")}`
        : "23:59";

      tarefas.push({
        titulo,
        descricao: null,
        dataInicio,
        dataFim,
        horaFim,
        tipo: section.tipo,
        possuiNota: /^sim$/i.test(match[2]),
        pontuacaoMaxima: null,
        instrucoes: [],
        entregaveis: [],
        downloadUrls: [],
      });
      match = rowPattern.exec(section.chunk);
    }
  }

  return tarefas;
}

export function parseTarefasListPageHtml(
  html: string,
  detalhesByTitulo: Record<string, string> = {}
): TurmaVirtualTarefa[] {
  const sigaa = parseSigaaTarefasListHtml(html);
  if (sigaa.length > 0) {
    return sigaa.map((tarefa) => {
      const detalheHtml = detalhesByTitulo[tarefa.titulo];
      if (!detalheHtml) return tarefa;
      const detalhe = parseTarefaDetalheHtml(detalheHtml);
      return { ...tarefa, ...detalhe, tipo: tarefa.tipo };
    });
  }

  const rows = extractTableRowsFromHtml(html);
  const table = findTableByHeader(rows, [/titulo|t[ií]tulo|atividade/i]);
  if (!table) return [];

  const headers = table[0].map(normalizeHeader);
  const tituloIndex = headers.findIndex(
    (cell) => cell.includes("titulo") || cell.includes("atividade")
  );
  const periodoIndex = headers.findIndex(
    (cell) => cell.includes("periodo") || cell.includes("prazo") || cell.includes("entrega")
  );
  const notaIndex = headers.findIndex(
    (cell) => cell.includes("nota") || cell.includes("pontu")
  );
  const tipoIndex = headers.findIndex((cell) => cell.includes("tipo"));

  if (tituloIndex < 0) return [];

  const links = extractLinkHrefs(html);
  const tarefas: TurmaVirtualTarefa[] = [];

  for (const row of table.slice(1)) {
    const titulo = row[tituloIndex]?.trim();
    if (!titulo) continue;

    const periodo = periodoIndex >= 0 ? row[periodoIndex] ?? "" : "";
    const { dataInicio, dataFim, horaFim } = parsePeriodoCell(periodo);
    const notaCell = notaIndex >= 0 ? row[notaIndex] ?? "" : "";
    const { possuiNota, pontuacaoMaxima } = parsePossuiNotaCell(notaCell);
    const tipoCell = tipoIndex >= 0 ? row[tipoIndex] ?? "" : row.join(" ");
    const detalheHtml = detalhesByTitulo[titulo];
    const detalhe = detalheHtml ? parseTarefaDetalheHtml(detalheHtml) : null;

    tarefas.push({
      titulo,
      descricao: detalhe?.descricao ?? null,
      dataInicio,
      dataFim,
      horaFim,
      tipo: inferTipoTarefa(tipoCell),
      possuiNota,
      pontuacaoMaxima,
      instrucoes: detalhe?.instrucoes ?? [],
      entregaveis: detalhe?.entregaveis ?? [],
      downloadUrls: detalhe?.downloadUrls ?? links
        .filter((link) => link.label === titulo)
        .map((link) => link.href),
    });
  }

  return tarefas;
}

export { parseTarefaDetalheHtml };
