import { extractHorarioCodigoFromText } from "@/lib/schedule/parse-sigaa-codigo";
import type {
  PortalAlunoSnapshot,
  PortalAtividadePendente,
  PortalDiscenteSnapshot,
  PortalDisciplinaSemestre,
  PortalIntegralizacaoItem,
  PortalIntegralizacaoResumo,
  PortalPageRawData,
} from "@/lib/scraper/types/portal-discente";
import { parsePortalAtividadesFromHtml } from "@/lib/scraper/portal-discente/parse-portal-atividades";
import {
  inferSemestreAtualFromHtml,
  parseDisciplinasHorarioFromHtml,
} from "@/lib/scraper/portal-discente/parse-portal-horario";
import { ENG_COMPUTACAO_CH_CATALOG } from "@/lib/integralizacao/ch-catalog";

const CH_TYPES = [
  "Obrigatória",
  "Optativa",
  "Complementar",
  "Extensão",
  "Flexibilizada",
] as const;

const CH_PENDENTE_LABEL: Record<(typeof CH_TYPES)[number], RegExp> = {
  Obrigatória: /c\.?h\.?\s*obrigatoria\s*pendente/,
  Optativa: /c\.?h\.?\s*optativa\s*pendente/,
  Complementar: /c\.?h\.?\s*complementar\s*pendente/,
  Extensão: /c\.?h\.?\s*extensao\s*pendente/,
  Flexibilizada: /c\.?h\.?\s*flexibilizada\s*pendente/,
};

/** Label de uma única categoria (evita linha agregada "Integralizações: CH. … CH. …"). */
const CH_PENDENTE_EXACT_LABEL: Record<(typeof CH_TYPES)[number], RegExp> = {
  Obrigatória: /^c\.?h\.?\s*obrigatoria\s*pendente$/,
  Optativa: /^c\.?h\.?\s*optativa\s*pendente$/,
  Complementar: /^c\.?h\.?\s*complementar\s*pendente$/,
  Extensão: /^c\.?h\.?\s*extensao\s*pendente$/,
  Flexibilizada: /^c\.?h\.?\s*flexibilizada\s*pendente$/,
};

const CH_TOTAL_CURRICULO_LABEL = /^c\.?h\.?\s*total\s*curriculo$/;

const DISCIPLINA_CODE_PATTERN = /^[A-Z][A-Z0-9.-]{2,}$/;
const BLOCKED_DISCIPLINA_CODES = new Set([
  "OBRIGATÓRIA",
  "OBRIGATORIA",
  "OPTATIVA",
  "COMPLEMENTAR",
  "EXTENSÃO",
  "EXTENSAO",
  "FLEXIBILIZADA",
  "E-MAIL",
  "EMAIL",
  "MATRÍCULA",
  "MATRICULA",
  "NOME",
  "CURSO",
  "SITUAÇÃO",
  "SITUACAO",
  "DISCIPLINA",
  "TÍTULO",
  "TITULO",
  "ENSINO",
  "DATA",
  "ATIVIDADE",
  "COMPONENTE",
]);
const BR_DATE_PATTERN = /(\d{2})\/(\d{2})\/(\d{4})/;
/** Prazo de "Minhas Atividades": `08/07/2026 23:59 (8 dias)` */
const ATIVIDADE_PRAZO_KEY_PATTERN = /^\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}/;
const ATIVIDADE_EXCLUDE_PATTERN =
  /nova\s+not[ií]cia|indica(?:ç|c)(?:ã|a)o\s+de\s+site|novo\s+t[oó]pico|últimas\s+atualiza|ultimas\s+atualiza|avalia(?:ç|c)(?:ã|a)o\s+marcada/i;
const DISCIPLINA_PAIR_SKIP = /^(ch\.|matricula|curso|data|titulo|rg|integraliz|ultimas|componente|nivel|status|e-?mail|entrada|ensino)/i;

function normalizeLabel(label: string): string {
  return label
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/:$/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeNome(value: string): string {
  return normalizeLabel(value).replace(/[^\w\s]/g, "").trim();
}

function findPairValue(
  pairs: Record<string, string>,
  matchers: RegExp[]
): string | null {
  for (const [label, value] of Object.entries(pairs)) {
    const normalized = normalizeLabel(label);
    if (matchers.some((matcher) => matcher.test(normalized))) {
      return value.trim() || null;
    }
  }
  return null;
}

function parseIntegerHours(value: string | null | undefined): number | null {
  if (!value?.trim()) return null;
  const digits = value.replace(/[^\d]/g, "");
  const parsed = Number(digits);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseDecimalNumber(value: string | null | undefined): number | null {
  if (!value?.trim()) return null;
  const match = value.match(/(\d+[.,]\d+|\d+)/);
  if (!match) return null;
  const parsed = Number(match[1].replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function parseBrDateToIso(value: string): string | null {
  const match = value.match(BR_DATE_PATTERN);
  if (!match) return null;
  return `${match[3]}-${match[2]}-${match[1]}`;
}

function parseRg(raw: PortalPageRawData): number | null {
  const rgLabel = findPairValue(raw.labelPairs, [/^rg$/, /indice geral/, /rendimento geral/]);
  const fromLabel = parseDecimalNumber(rgLabel);
  if (fromLabel !== null) return fromLabel;

  const textMatch = raw.plainText.match(
    /(?:RG|Índice Geral|Rendimento Geral)\s*:?\s*([\d.,]+)/i
  );
  return parseDecimalNumber(textMatch?.[1] ?? null);
}

function parseNomeFromPlainText(plainText: string): string | null {
  const meusDados = plainText.match(
    /Meus Dados Pessoais\s+([A-ZÀ-Ú][A-ZÀ-Ú\s.]{4,}?)\s+Regulamento/i
  );
  if (meusDados?.[1]) return meusDados[1].trim();

  const header = plainText.match(
    /Semestre atual:\s*\d{4}\.\d\s+([A-ZÀ-Ú][A-ZÀ-Ú\s.]{4,}?)\s+DIRETORIA/i
  );
  return header?.[1]?.trim() ?? null;
}

function parseAluno(raw: PortalPageRawData): PortalAlunoSnapshot {
  const matricula =
    findPairValue(raw.labelPairs, [/matricula/]) ??
    raw.plainText.match(/Matr[íi]cula\s*:?\s*(\d+)/i)?.[1] ??
    "0000000000";

  const nome =
    findPairValue(raw.labelPairs, [/^nome$/, /^discente$/, /nome do discente/]) ??
    parseNomeFromPlainText(raw.plainText) ??
    "Discente";

  return {
    matricula,
    nome,
    curso: findPairValue(raw.labelPairs, [/^curso$/, /programa/]),
    email: findPairValue(raw.labelPairs, [/e-?mail/, /email institucional/]),
    semestreEntrada: findPairValue(raw.labelPairs, [
      /^entrada$/,
      /semestre de ingresso/,
      /periodo de ingresso/,
      /ano\/periodo de ingresso/,
    ]),
    rg: parseRg(raw),
    status: findPairValue(raw.labelPairs, [/^status$/, /situacao/, /vinculo/]),
  };
}

function countMatchingChPendenteLabels(normalized: string): number {
  return CH_TYPES.filter((tipo) => CH_PENDENTE_LABEL[tipo].test(normalized)).length;
}

function resolveChTipoFromExactLabel(normalized: string): (typeof CH_TYPES)[number] | null {
  if (countMatchingChPendenteLabels(normalized) !== 1) return null;
  return CH_TYPES.find((tipo) => CH_PENDENTE_EXACT_LABEL[tipo].test(normalized)) ?? null;
}

function buildIntegralizacaoFromPendente(
  tipo: (typeof CH_TYPES)[number],
  pendente: number
): PortalIntegralizacaoItem {
  const catalogEntry = ENG_COMPUTACAO_CH_CATALOG.find((entry) => entry.tipoCh === tipo);
  const totalNecessario = catalogEntry?.totalRequired ?? null;
  const concluido =
    totalNecessario !== null ? Math.max(0, totalNecessario - pendente) : 0;

  return {
    tipoCh: tipo,
    concluido,
    pendente,
    totalNecessario,
  };
}

function parseIntegralizacaoFromPairs(
  pairs: Record<string, string>
): Map<string, PortalIntegralizacaoItem> {
  const items = new Map<string, PortalIntegralizacaoItem>();

  for (const [label, value] of Object.entries(pairs)) {
    const normalized = normalizeLabel(label);
    const tipo = resolveChTipoFromExactLabel(normalized);
    if (!tipo) continue;

    const pendente = parseIntegerHours(value);
    if (pendente === null) continue;

    items.set(tipo, buildIntegralizacaoFromPendente(tipo, pendente));
  }

  return items;
}

function parseIntegralizacaoFromTableRows(
  rows: string[][]
): Map<string, PortalIntegralizacaoItem> {
  const items = new Map<string, PortalIntegralizacaoItem>();

  for (const row of rows) {
    for (let index = 0; index < row.length - 1; index += 1) {
      const normalized = normalizeLabel(row[index] ?? "");
      const tipo = resolveChTipoFromExactLabel(normalized);
      if (!tipo) continue;

      const pendente = parseIntegerHours(row[index + 1] ?? "");
      if (pendente === null) continue;

      items.set(tipo, buildIntegralizacaoFromPendente(tipo, pendente));
      index += 1;
    }
  }

  return items;
}

function parseTotalCurriculoFromPairs(pairs: Record<string, string>): number | null {
  for (const [label, value] of Object.entries(pairs)) {
    if (!CH_TOTAL_CURRICULO_LABEL.test(normalizeLabel(label))) continue;
    return parseIntegerHours(value);
  }
  return null;
}

function parseTotalCurriculoFromTableRows(rows: string[][]): number | null {
  for (const row of rows) {
    for (let index = 0; index < row.length - 1; index += 1) {
      if (!CH_TOTAL_CURRICULO_LABEL.test(normalizeLabel(row[index] ?? ""))) continue;
      const total = parseIntegerHours(row[index + 1] ?? "");
      if (total !== null) return total;
    }
  }
  return null;
}

function parsePercentIntegralizado(raw: PortalPageRawData): number | null {
  const fromText = raw.plainText.match(/(\d{1,3})\s*%\s*integralizado/i);
  if (fromText) {
    const parsed = Number(fromText[1]);
    if (Number.isFinite(parsed)) return parsed;
  }

  for (const row of raw.tableRows) {
    for (const cell of row) {
      const match = cell.match(/(\d{1,3})\s*%\s*integralizado/i);
      if (!match) continue;
      const parsed = Number(match[1]);
      if (Number.isFinite(parsed)) return parsed;
    }
  }

  return null;
}

function parseIntegralizacaoResumo(raw: PortalPageRawData): PortalIntegralizacaoResumo {
  return {
    totalCurriculo:
      parseTotalCurriculoFromPairs(raw.labelPairs) ??
      parseTotalCurriculoFromTableRows(raw.tableRows),
    percentIntegralizado: parsePercentIntegralizado(raw),
  };
}

function parseIntegralizacao(raw: PortalPageRawData): PortalIntegralizacaoItem[] {
  const items = parseIntegralizacaoFromPairs(raw.labelPairs);

  for (const [tipo, item] of parseIntegralizacaoFromTableRows(raw.tableRows)) {
    items.set(tipo, item);
  }

  return Array.from(items.values());
}

function extractHorarioCodigo(text: string): string | null {
  return extractHorarioCodigoFromText(text);
}

function parseDisciplinaRow(row: string[]): PortalDisciplinaSemestre | null {
  if (row.length < 2) return null;

  const joined = row.join(" ");
  const codigoHorario = extractHorarioCodigo(joined);
  if (!codigoHorario) return null;
  if (BR_DATE_PATTERN.test(joined) && !DISCIPLINA_CODE_PATTERN.test(row[0]?.trim() ?? "")) {
    return null;
  }

  const codigo = row[0]?.trim().toUpperCase();
  if (codigo && DISCIPLINA_CODE_PATTERN.test(codigo) && !BLOCKED_DISCIPLINA_CODES.has(codigo)) {
    const nome = row[1]?.trim() || codigo;
    const local =
      row.find((cell, index) => index > 1 && /\d{2,3}\/\d{2,3}/.test(cell)) ??
      row.find((cell, index) => index > 1 && /sala|lab/i.test(cell)) ??
      null;

    return {
      codigo,
      nome,
      local,
      codigoHorario,
      horarioTraduzido: null,
    };
  }

  const nomeLongo = row[0]?.trim();
  if (!nomeLongo || nomeLongo.length < 4 || DISCIPLINA_PAIR_SKIP.test(normalizeLabel(nomeLongo))) {
    return null;
  }

  const local =
    row.find((cell, index) => index > 0 && /\d{2,3}\/\d{2,3}/.test(cell)) ??
    row.find((cell, index) => index > 0 && /sala|lab/i.test(cell)) ??
    null;

  return {
    codigo: nomeLongo,
    nome: nomeLongo,
    local,
    codigoHorario,
    horarioTraduzido: null,
  };
}

function extractLocalFromHorario(value: string): string | null {
  const roomMatch = value.match(/\b(\d{2,3}(?:\/\d{2,3})?)\b/);
  return roomMatch?.[1] ?? null;
}

function parseDisciplinasFromPairs(
  pairs: Record<string, string>
): PortalDisciplinaSemestre[] {
  const disciplinas = new Map<string, PortalDisciplinaSemestre>();

  for (const [nome, value] of Object.entries(pairs)) {
    const trimmedNome = nome.trim();
    if (trimmedNome.length < 4) continue;
    if (DISCIPLINA_PAIR_SKIP.test(normalizeLabel(trimmedNome))) continue;
    if (!extractHorarioCodigoFromText(value)) continue;

    const codigoHorario = extractHorarioCodigo(value);
    disciplinas.set(normalizeNome(trimmedNome), {
      codigo: trimmedNome,
      nome: trimmedNome,
      local: extractLocalFromHorario(value),
      codigoHorario,
      horarioTraduzido: null,
    });
  }

  return Array.from(disciplinas.values());
}

function parseDisciplinasSemestre(raw: PortalPageRawData): PortalDisciplinaSemestre[] {
  const disciplinas = new Map<string, PortalDisciplinaSemestre>();

  if (raw.html) {
    for (const disciplina of parseDisciplinasHorarioFromHtml(raw.html)) {
      disciplinas.set(normalizeNome(disciplina.nome), disciplina);
    }
  }

  for (const disciplina of parseDisciplinasFromPairs(raw.labelPairs)) {
    disciplinas.set(normalizeNome(disciplina.nome), disciplina);
  }

  for (const row of raw.tableRows) {
    const parsed = parseDisciplinaRow(row);
    if (parsed) {
      disciplinas.set(normalizeNome(parsed.nome), parsed);
    }
  }

  return Array.from(disciplinas.values());
}

function inferTipoAtividade(text: string): "individual" | "grupo" | null {
  const normalized = text.toLowerCase();
  if (/em\s+dupla|em\s+grupo|tarefas?\s+em\s+grupo/.test(normalized)) return "grupo";
  if (normalized.includes("grupo")) return "grupo";
  if (normalized.includes("individual")) return "individual";
  return null;
}

function parseAtividadeFromPair(key: string, value: string): PortalAtividadePendente | null {
  const trimmedKey = key.trim();
  const trimmedValue = value.trim();
  if (!ATIVIDADE_PRAZO_KEY_PATTERN.test(trimmedKey)) return null;
  if (ATIVIDADE_EXCLUDE_PATTERN.test(trimmedKey) || ATIVIDADE_EXCLUDE_PATTERN.test(trimmedValue)) {
    return null;
  }

  const tarefaMatch = trimmedValue.match(/Tarefa:\s*(.+)/i);
  if (!tarefaMatch) return null;

  const dateMatch = trimmedKey.match(BR_DATE_PATTERN);
  if (!dateMatch) return null;

  const dataFim = parseBrDateToIso(dateMatch[0]);
  if (!dataFim) return null;

  const horaFim = trimmedKey.match(/\b(\d{2}:\d{2})\b/)?.[1] ?? "23:59";
  const titulo = tarefaMatch[1].trim();
  const disciplinaNome = trimmedValue.split(/\s+Tarefa:/i)[0]?.trim() ?? trimmedValue;

  return {
    disciplinaCodigo: disciplinaNome,
    titulo,
    dataFim,
    horaFim,
    tipo: inferTipoAtividade(trimmedValue),
    descricao: trimmedValue,
    enviada: false,
  };
}

function parseAtividades(raw: PortalPageRawData): PortalAtividadePendente[] {
  if (raw.html) {
    const fromForm = parsePortalAtividadesFromHtml(raw.html);
    if (fromForm.length > 0) return fromForm;
  }

  const atividades: PortalAtividadePendente[] = [];
  const seen = new Set<string>();

  for (const [key, value] of Object.entries(raw.labelPairs)) {
    const parsed = parseAtividadeFromPair(key, value);
    if (!parsed) continue;

    const dedupeKey = `${parsed.dataFim}:${parsed.titulo}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);
    atividades.push(parsed);
  }

  for (const row of raw.tableRows) {
    if (row.length < 2) continue;

    const parsed = parseAtividadeFromPair(row[0] ?? "", row.slice(1).join(" "));
    if (!parsed) continue;

    const dedupeKey = `${parsed.dataFim}:${parsed.titulo}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);
    atividades.push(parsed);
  }

  return atividades;
}

export function parsePortalPageData(raw: PortalPageRawData): PortalDiscenteSnapshot {
  const semestreAtual = parseDisciplinasSemestre(raw);
  const semestreLetivo =
    (raw.html ? inferSemestreAtualFromHtml(raw.html) : null) ?? null;

  return {
    scrapedAt: new Date().toISOString(),
    aluno: parseAluno(raw),
    integralizacao: parseIntegralizacao(raw),
    integralizacaoResumo: parseIntegralizacaoResumo(raw),
    semestreAtual,
    semestreLetivo,
    atividades: parseAtividades(raw),
  };
}

export function assertPortalSnapshot(snapshot: PortalDiscenteSnapshot): void {
  if (!snapshot.aluno.matricula.trim()) {
    throw new Error("Matrícula não encontrada no portal do discente.");
  }

  if (snapshot.semestreAtual.length === 0) {
    console.warn("[scraper:portal] Nenhuma disciplina do semestre encontrada no portal.");
  }
}
