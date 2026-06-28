import type {
  PortalAlunoSnapshot,
  PortalAtividadePendente,
  PortalDiscenteSnapshot,
  PortalDisciplinaSemestre,
  PortalIntegralizacaoItem,
  PortalPageRawData,
} from "@/lib/scraper/types/portal-discente";
import { ENG_COMPUTACAO_CH_CATALOG } from "@/lib/integralizacao/ch-catalog";

const CH_TYPES = [
  "Obrigatória",
  "Optativa",
  "Complementar",
  "Extensão",
  "Flexibilizada",
] as const;

const CH_PENDENTE_LABEL: Record<(typeof CH_TYPES)[number], RegExp> = {
  Obrigatória: /ch\.?\s*obrigatoria\s*pendente/,
  Optativa: /ch\.?\s*optativa\s*pendente/,
  Complementar: /ch\.?\s*complementar\s*pendente/,
  Extensão: /ch\.?\s*extensao\s*pendente/,
  Flexibilizada: /ch\.?\s*flexibilizada\s*pendente/,
};

const DISCIPLINA_CODE_PATTERN = /^[A-Z][A-Z0-9-]{2,}$/;
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
const SIGAA_HORARIO_PATTERN = /\b[2-6][MTN](?:12|34|56)\b/gi;
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

function parseIntegralizacaoFromRow(row: string[]): PortalIntegralizacaoItem | null {
  const joined = row.join(" ");
  const tipo = CH_TYPES.find((label) =>
    joined.toLowerCase().includes(label.toLowerCase())
  );
  if (!tipo) return null;

  const numbers =
    joined.match(/[\d.]+/g)?.map((token) => parseIntegerHours(token) ?? 0) ?? [];
  if (numbers.length === 0) return null;

  const concluido = numbers[0] ?? 0;
  const totalNecessario = numbers.length >= 3 ? numbers[numbers.length - 1] : numbers[1] ?? null;
  const pendente =
    totalNecessario !== null && totalNecessario !== undefined
      ? Math.max(0, totalNecessario - concluido)
      : numbers[1] ?? 0;

  return {
    tipoCh: tipo,
    concluido,
    pendente,
    totalNecessario: totalNecessario ?? null,
  };
}

function parseIntegralizacaoFromPairs(
  pairs: Record<string, string>
): Map<string, PortalIntegralizacaoItem> {
  const items = new Map<string, PortalIntegralizacaoItem>();

  for (const [label, value] of Object.entries(pairs)) {
    const normalized = normalizeLabel(label);

    for (const tipo of CH_TYPES) {
      if (!CH_PENDENTE_LABEL[tipo].test(normalized)) continue;

      const pendente = parseIntegerHours(value) ?? 0;
      const catalogEntry = ENG_COMPUTACAO_CH_CATALOG.find(
        (entry) => entry.tipoCh === tipo
      );
      const totalNecessario = catalogEntry?.totalRequired ?? null;
      const concluido =
        totalNecessario !== null ? Math.max(0, totalNecessario - pendente) : 0;

      items.set(tipo, {
        tipoCh: tipo,
        concluido,
        pendente,
        totalNecessario,
      });
    }
  }

  return items;
}

function parseIntegralizacao(raw: PortalPageRawData): PortalIntegralizacaoItem[] {
  const items = parseIntegralizacaoFromPairs(raw.labelPairs);

  for (const row of raw.tableRows) {
    const parsed = parseIntegralizacaoFromRow(row);
    if (parsed) {
      items.set(parsed.tipoCh, parsed);
    }
  }

  return Array.from(items.values());
}

function extractHorarioCodigo(text: string): string | null {
  const matches = text.match(SIGAA_HORARIO_PATTERN);
  if (!matches?.length) return null;
  return matches.map((token) => token.toUpperCase()).join(" ");
}

function parseDisciplinaRow(row: string[]): PortalDisciplinaSemestre | null {
  if (row.length < 3) return null;

  const codigo = row[0]?.trim().toUpperCase();
  if (!codigo || !DISCIPLINA_CODE_PATTERN.test(codigo)) return null;
  if (BLOCKED_DISCIPLINA_CODES.has(codigo)) return null;
  if (BR_DATE_PATTERN.test(row.join(" "))) return null;

  const nome = row[1]?.trim() || codigo;
  const joined = row.join(" ");
  const codigoHorario = extractHorarioCodigo(joined);
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
    if (trimmedNome.length < 12) continue;
    if (DISCIPLINA_PAIR_SKIP.test(normalizeLabel(trimmedNome))) continue;
    if (!SIGAA_HORARIO_PATTERN.test(value)) continue;

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
  if (normalized.includes("grupo")) return "grupo";
  if (normalized.includes("individual")) return "individual";
  return null;
}

function parseAtividadeFromPair(key: string, value: string): PortalAtividadePendente | null {
  const dateMatch = key.match(BR_DATE_PATTERN);
  if (!dateMatch) return null;

  const dataFim = parseBrDateToIso(dateMatch[0]);
  if (!dataFim) return null;

  const horaFim = key.match(/\b(\d{2}:\d{2})\b/)?.[1] ?? "23:59";
  const tarefaMatch =
    value.match(/Tarefa:\s*(.+)/i) ??
    value.match(/Avalia(?:ç|c)(?:ã|a)o[^:]*:\s*(.+)/i);
  const titulo = tarefaMatch?.[1]?.trim() ?? value.trim().slice(0, 120);
  const disciplinaNome = value.split(/\s+Tarefa:/i)[0]?.trim() ?? value.trim();

  return {
    disciplinaCodigo: disciplinaNome,
    titulo,
    dataFim,
    horaFim,
    tipo: inferTipoAtividade(value),
    descricao: value.trim(),
  };
}

function parseAtividades(raw: PortalPageRawData): PortalAtividadePendente[] {
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
    const joined = row.join(" ");
    const dateMatch = joined.match(BR_DATE_PATTERN);
    if (!dateMatch) continue;

    if (/tarefa|avalia/i.test(joined)) {
      const parsed = parseAtividadeFromPair(row[0] ?? joined, row[1] ?? joined);
      if (!parsed) continue;

      const dedupeKey = `${parsed.dataFim}:${parsed.titulo}`;
      if (seen.has(dedupeKey)) continue;
      seen.add(dedupeKey);
      atividades.push(parsed);
      continue;
    }

    const disciplinaCodigo =
      row.find((cell) => DISCIPLINA_CODE_PATTERN.test(cell.trim()))?.trim().toUpperCase() ??
      null;
    if (!disciplinaCodigo) continue;

    const titulo =
      row.find(
        (cell) =>
          cell.length > 3 &&
          !BR_DATE_PATTERN.test(cell) &&
          !DISCIPLINA_CODE_PATTERN.test(cell.trim())
      ) ?? "Atividade";

    const dataFim = parseBrDateToIso(dateMatch[0]);
    if (!dataFim) continue;

    const legacy: PortalAtividadePendente = {
      disciplinaCodigo,
      titulo: titulo.trim(),
      dataFim,
      horaFim: joined.match(/\b(\d{2}:\d{2})\b/)?.[1] ?? "23:59",
      tipo: inferTipoAtividade(joined),
      descricao: null,
    };

    const dedupeKey = `${legacy.dataFim}:${legacy.titulo}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);
    atividades.push(legacy);
  }

  return atividades;
}

export function parsePortalPageData(raw: PortalPageRawData): PortalDiscenteSnapshot {
  return {
    scrapedAt: new Date().toISOString(),
    aluno: parseAluno(raw),
    integralizacao: parseIntegralizacao(raw),
    semestreAtual: parseDisciplinasSemestre(raw),
    atividades: parseAtividades(raw),
  };
}

export function assertPortalSnapshot(snapshot: PortalDiscenteSnapshot): void {
  if (!snapshot.aluno.matricula.trim()) {
    throw new Error("Matrícula não encontrada no portal do discente.");
  }

  if (snapshot.semestreAtual.length === 0) {
    throw new Error("Nenhuma disciplina do semestre encontrada no portal.");
  }
}
