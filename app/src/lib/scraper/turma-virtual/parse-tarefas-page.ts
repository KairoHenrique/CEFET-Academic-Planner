import {
  extractLinkHrefs,
  extractTableRowsFromHtml,
  findTableByHeader,
  normalizeHeader,
  parseBrDateToIso,
  parseBrDecimal,
  stripHtmlTags,
} from "@/lib/scraper/turma-virtual/html-utils";
import { formatSigaaDescriptionHtml } from "@/lib/format/description-html";
import type { TurmaVirtualTarefa } from "@/lib/scraper/types/turma-virtual";

const PERIOD_PATTERN =
  /(\d{2}\/\d{2}\/\d{4})(?:\s*(?:-|–|a)\s*(\d{2}\/\d{2}\/\d{4}))?(?:\s+(\d{2}:\d{2}))?/;

const SIGAA_PERIODO_PATTERN =
  /de\s+(\d{2}\/\d{2}\/\d{4})\s+às\s+(\d{1,2})h(\d{0,2})\s+a\s+(\d{2}\/\d{2}\/\d{4})\s+às\s+(\d{1,2})h(\d{0,2})\s+(Sim|N[aã]o)/i;

const SIGAA_ROW_END_PATTERN =
  /de\s+(\d{2}\/\d{2}\/\d{4})\s+às\s+(\d{1,2})h(\d{0,2})\s+a\s+(\d{2}\/\d{2}\/\d{4})\s+às\s+(\d{1,2})h(\d{0,2})\s+(Sim|N[aã]o)/gi;

const TITLE_CODE_SUFFIX_PATTERN =
  /([A-Z]{2,}\d*\s*-\s*[A-Za-zÀ-ú0-9][^.!?\n]{4,140})$/;

const MENU_TITULO_NOISE =
  /turma\s*virtual|menu|manual|participantes|gerenciar\s*perfil|plano\s*de\s*curso|ver\s*(notas|grupo)|frequ[eê]ncia|conte[uú]do|refer[eê]ncias|avalia[cç][oõ]es|enquetes|question[aá]rios|estat[ií]sticas|linha\s*do\s*tempo|tarefas?\s*(individuais|em\s+grupo)\s*$/i;

function isPlausibleTaskTitulo(titulo: string): boolean {
  const trimmed = titulo.trim();
  if (trimmed.length < 4 || trimmed.length > 200) return false;
  if (MENU_TITULO_NOISE.test(trimmed)) return false;
  if (/^(sim|n[aã]o|voltar|cancelar|detalhar)$/i.test(trimmed)) return false;
  if (trimmed.split(/\s+/).length > 14) return false;
  return true;
}

function hasSigaaTarefasLayout(html: string): boolean {
  SIGAA_ROW_END_PATTERN.lastIndex = 0;
  return SIGAA_ROW_END_PATTERN.test(stripHtmlTags(html));
}

function inferTipoTarefa(text: string): TurmaVirtualTarefa["tipo"] {
  const normalized = normalizeHeader(text);
  if (
    /em\s+dupla|em\s+grupo|tarefas?\s+em\s+grupo|max\.?\s*\d+\s+alunos/.test(
      normalized
    )
  ) {
    return "grupo";
  }
  if (normalized.includes("grupo")) return "grupo";
  if (normalized.includes("individual")) return "individual";
  return null;
}

function resolveTipoTarefa(
  sectionTipo: TurmaVirtualTarefa["tipo"],
  titulo: string,
  descricao: string | null
): TurmaVirtualTarefa["tipo"] {
  const fromContent = inferTipoTarefa(`${titulo} ${descricao ?? ""}`);
  return fromContent ?? sectionTipo;
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

function normalizeDescricaoText(value: string): string {
  return formatSigaaDescriptionHtml(value);
}

function extractResponderTarefaDescricao(html: string): string | null {
  const scope = scopeResponderTarefaHtml(html);

  const campoMatch = scope.match(
    /<label>\s*Descri[cç][aã]o:\s*<\/label>\s*<div class="campo">([\s\S]*?)<\/div>\s*<\/li>/i
  );
  if (campoMatch) {
    const text = normalizeDescricaoText(campoMatch[1]);
    if (text.length >= 8) return text.slice(0, 8000);
  }

  const hiddenDescricao = scope.match(
    /<input[^>]*type=["']hidden["'][^>]*value=["']((?:&lt;div&gt;|&lt;p&gt;)[\s\S]*?)["']/i
  );
  if (hiddenDescricao) {
    const text = normalizeDescricaoText(hiddenDescricao[1]);
    if (text.length >= 8) return text.slice(0, 8000);
  }

  const simpleMatch = html.match(
    /(?:>|^)\s*Descri[cç][aã]o:\s*([^<]+)</i
  );
  if (simpleMatch) {
    const text = normalizeDescricaoText(simpleMatch[1]);
    if (text.length >= 8) return text.slice(0, 8000);
  }

  return null;
}

function scopeResponderTarefaHtml(html: string): string {
  const fieldsetMatch = html.match(
    /<fieldset[^>]*class=["'][^"']*responderTarefa[^"']*["'][\s\S]*?<\/fieldset>/i
  );
  if (fieldsetMatch) return fieldsetMatch[0];

  const legendIndex = html.search(/Responder\s+tarefa/i);
  if (legendIndex >= 0) return html.slice(legendIndex);

  return html;
}

function parseQuestionarioDetalheHtml(html: string): Pick<
  TurmaVirtualTarefa,
  "descricao" | "instrucoes" | "entregaveis" | "downloadUrls"
> {
  const parts: string[] = [];

  const operacaoMatch = html.match(
    /<div class="descricaoOperacao">([\s\S]*?)<\/div>/i
  );
  if (operacaoMatch) {
    const text = formatSigaaDescriptionHtml(operacaoMatch[1]);
    if (text) parts.push(text);
  }

  const configMatch = html.match(
    /O question[aá]rio est[aá] configurado[\s\S]*?<\/div>/i
  );
  if (configMatch) {
    const text = formatSigaaDescriptionHtml(configMatch[0]);
    if (text) parts.push(text);
  }

  const periodoMatch = html.match(/Inicia em[\s\S]*?finaliza em[^<]+/i);
  if (periodoMatch) {
    const text = formatSigaaDescriptionHtml(periodoMatch[0]);
    if (text) parts.push(text);
  }

  const tentativasMatch = html.match(/permite\s+\d+\s+tentativa[\s\S]*?restante/i);
  if (tentativasMatch) {
    const text = formatSigaaDescriptionHtml(tentativasMatch[0]);
    if (text) parts.push(text);
  }

  return {
    descricao: parts.length > 0 ? parts.join("").slice(0, 8000) : null,
    instrucoes: [],
    entregaveis: [],
    downloadUrls: [],
  };
}

export function parseTarefaDetalheHtml(html: string): Pick<
  TurmaVirtualTarefa,
  "descricao" | "instrucoes" | "entregaveis" | "downloadUrls"
> {
  const scope = scopeResponderTarefaHtml(html);
  const descricao = extractResponderTarefaDescricao(html);

  return {
    descricao,
    instrucoes: parseBulletList(scope, /instru[cç][oõ]es?/i),
    entregaveis: parseBulletList(scope, /entreg[aá]veis?/i),
    downloadUrls: extractLinkHrefs(scope)
      .filter((link) => /\.(pdf|doc|docx|zip|rar)$/i.test(link.href))
      .map((link) => link.href),
  };
}

/** Parser unificado para tela de tarefa ou questionário aberta pelo portal. */
export function parseAtividadeDetalheHtml(html: string): Pick<
  TurmaVirtualTarefa,
  "descricao" | "instrucoes" | "entregaveis" | "downloadUrls"
> {
  if (
    /visualizarQuestionario|descricaoOperacao|Acessar\s+Question[aá]rio/i.test(
      html
    )
  ) {
    return parseQuestionarioDetalheHtml(html);
  }

  return parseTarefaDetalheHtml(html);
}

function extractInlineDescricao(
  chunk: string,
  periodStart: number,
  titulo: string
): string | null {
  const before = chunk.slice(0, periodStart).trimEnd();
  const tituloIndex = before.lastIndexOf(titulo);
  if (tituloIndex <= 0) return null;

  const descricao = before.slice(0, tituloIndex).trim();
  if (descricao.length < 12 || !looksLikeInstructionText(descricao)) return null;
  return descricao.slice(0, 4000);
}

function looksLikeInstructionText(text: string): boolean {
  const normalized = normalizeHeader(text);
  return (
    /envie\s+o\s+codigo|codigo\s*fonte|alterado\s*\(|atividade\s+em\s+dupla|max\.?\s*\d+\s+alunos|ex\d+\.asm/.test(
      normalized
    ) || /^\d+[.)]/.test(text.trim())
  );
}

function normalizeSigaaTitulo(raw: string): string {
  const trimmed = raw.trim().replace(/\s+de\s*$/i, "").trim();
  if (!trimmed) return trimmed;

  const codeSuffix = trimmed.match(TITLE_CODE_SUFFIX_PATTERN);
  if (codeSuffix && trimmed.length > codeSuffix[1].length + 20) {
    return codeSuffix[1].trim();
  }

  if (looksLikeInstructionText(trimmed) && codeSuffix) {
    return codeSuffix[1].trim();
  }

  return trimmed;
}

function extractTituloBeforePeriod(chunk: string, periodStart: number): string | null {
  const before = chunk.slice(0, periodStart).trimEnd();
  const deIndex = before.lastIndexOf(" de");
  if (deIndex < 0) return null;

  let title = before.slice(0, deIndex).trim();
  const lineParts = title.split(/\n+/).map((part) => part.trim()).filter(Boolean);
  title = lineParts[lineParts.length - 1] ?? title;
  title = normalizeSigaaTitulo(title);

  if (title.length < 3 || title.length > 160) return null;
  if (looksLikeInstructionText(title) && !TITLE_CODE_SUFFIX_PATTERN.test(title)) {
    return null;
  }

  return title;
}

function parseSigaaPeriodo(match: RegExpExecArray): {
  dataInicio: string | null;
  dataFim: string | null;
  horaFim: string;
  possuiNota: boolean;
} {
  const dataInicio = parseBrDateToIso(match[1]);
  const dataFim = parseBrDateToIso(match[4]);
  const horaFim = `${match[5].padStart(2, "0")}:${(match[6] || "0").padStart(2, "0")}`;
  return {
    dataInicio,
    dataFim,
    horaFim,
    possuiNota: /^sim$/i.test(match[7]),
  };
}

function dedupeTarefas(tarefas: TurmaVirtualTarefa[]): TurmaVirtualTarefa[] {
  const seen = new Map<string, TurmaVirtualTarefa>();

  for (const tarefa of tarefas) {
    const key = `${tarefa.dataFim ?? ""}|${normalizeHeader(tarefa.titulo)}`;
    const existing = seen.get(key);
    if (!existing) {
      seen.set(key, tarefa);
      continue;
    }

    const existingScore =
      (existing.descricao ? 1 : 0) + (looksLikeInstructionText(existing.titulo) ? -2 : 2);
    const candidateScore =
      (tarefa.descricao ? 1 : 0) + (looksLikeInstructionText(tarefa.titulo) ? -2 : 2);
    if (candidateScore > existingScore) {
      seen.set(key, tarefa);
    }
  }

  return Array.from(seen.values());
}

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

    SIGAA_ROW_END_PATTERN.lastIndex = 0;
    let match = SIGAA_ROW_END_PATTERN.exec(section.chunk);

    while (match) {
      const periodStart = match.index;
      const tituloRaw = extractTituloBeforePeriod(section.chunk, periodStart);
      if (tituloRaw && isPlausibleTaskTitulo(tituloRaw)) {
        const periodo = parseSigaaPeriodo(match);
        if (!periodo.dataFim) {
          match = SIGAA_ROW_END_PATTERN.exec(section.chunk);
          continue;
        }
        const descricao = extractInlineDescricao(section.chunk, periodStart, tituloRaw);
        tarefas.push({
          titulo: tituloRaw,
          descricao,
          dataInicio: periodo.dataInicio,
          dataFim: periodo.dataFim,
          horaFim: periodo.horaFim,
          tipo: resolveTipoTarefa(section.tipo, tituloRaw, descricao),
          possuiNota: periodo.possuiNota,
          pontuacaoMaxima: null,
          instrucoes: [],
          entregaveis: [],
          downloadUrls: [],
        });
      }
      match = SIGAA_ROW_END_PATTERN.exec(section.chunk);
    }
  }

  return dedupeTarefas(tarefas);
}

function parseTarefasFromTable(
  html: string,
  detalhesByTitulo: Record<string, string>
): TurmaVirtualTarefa[] {
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
    if (!titulo || !isPlausibleTaskTitulo(titulo)) continue;

    const periodo = periodoIndex >= 0 ? row[periodoIndex] ?? "" : "";
    const { dataInicio, dataFim, horaFim } = parsePeriodoCell(periodo);
    if (!dataFim) continue;
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
      tipo: resolveTipoTarefa(inferTipoTarefa(tipoCell), titulo, detalhe?.descricao ?? null),
      possuiNota,
      pontuacaoMaxima,
      instrucoes: detalhe?.instrucoes ?? [],
      entregaveis: detalhe?.entregaveis ?? [],
      downloadUrls:
        detalhe?.downloadUrls ??
        links.filter((link) => link.label === titulo).map((link) => link.href),
    });
  }

  return tarefas;
}

export function extractTarefaDetalheLinkLabels(html: string): string[] {
  const labels = new Set<string>();

  for (const link of extractLinkHrefs(html)) {
    const label = link.label.trim();
    if (label.length < 4 || label.length > 120) continue;
    if (!isPlausibleTaskTitulo(label)) continue;
    if (/^(sim|n[aã]o|voltar|detalhar|visualizar)$/i.test(label)) continue;
    if (!/tarefa|detalh|visualiz/i.test(link.href)) continue;
    labels.add(label);
  }

  return Array.from(labels);
}

export function parseTarefasListPageHtml(
  html: string,
  detalhesByTitulo: Record<string, string> = {}
): TurmaVirtualTarefa[] {
  const mergeDetalhes = (tarefas: TurmaVirtualTarefa[]) =>
    tarefas.map((tarefa) => {
      const detalheHtml = detalhesByTitulo[tarefa.titulo];
      const detalhe = detalheHtml ? parseTarefaDetalheHtml(detalheHtml) : null;
      return {
        ...tarefa,
        descricao: detalhe?.descricao ?? tarefa.descricao,
        instrucoes: detalhe?.instrucoes ?? tarefa.instrucoes,
        entregaveis: detalhe?.entregaveis ?? tarefa.entregaveis,
        downloadUrls: detalhe?.downloadUrls ?? tarefa.downloadUrls,
        tipo: resolveTipoTarefa(tarefa.tipo, tarefa.titulo, detalhe?.descricao ?? null),
      };
    });

  if (hasSigaaTarefasLayout(html)) {
    return mergeDetalhes(parseSigaaTarefasListHtml(html));
  }

  const fromTable = parseTarefasFromTable(html, detalhesByTitulo);
  if (fromTable.length > 0) {
    return fromTable;
  }

  return mergeDetalhes(parseSigaaTarefasListHtml(html));
}

export { SIGAA_PERIODO_PATTERN };
