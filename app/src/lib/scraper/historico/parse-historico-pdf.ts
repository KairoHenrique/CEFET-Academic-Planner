import type {
  HistoricoDisciplinaEntry,
  HistoricoChResumo,
  HistoricoChTotais,
  HistoricoSnapshot,
} from "@/lib/scraper/types/historico";
import { extractHistoricoPdfText } from "@/lib/scraper/historico/extract-historico-pdf-text";

const SITUACAO_RE =
  /APR|APRN|REP|REPF|REPMF|REPN|REPNF|TRANC|MATR|DISP|CANC|CUMP|TRANS|INCORP|REC/;

const PROFESSOR_LINE =
  /(?:Dr\.|Dra\.|MSc\.|Me\.|Prof\.|MICHEL|Profª)/i;

const SEMESTRE_RE = /^(\d{4}\.\d)(?:\s+(.*))?$/;

const METADATA_LINE =
  /^(Curso:|Ano\s*\/|Forma de|Status:|Prazo|Reconhecimento|Processo|Entrada:|Matr[ií]cula|Página|--|\d+\s+de\s*$|-$|^\d{4}\.\d\s*\/)/i;

export async function parseHistoricoPdfBuffer(
  buffer: Buffer
): Promise<HistoricoSnapshot> {
  const text = await extractHistoricoPdfText(buffer);
  return parseHistoricoPdfText(text);
}

export function parseHistoricoPdfText(text: string): HistoricoSnapshot {
  const { chResumo, chTotais } = parseChResumo(text);
  return {
    scrapedAt: new Date().toISOString(),
    disciplinas: parseDisciplinas(text),
    chResumo,
    chTotais,
  };
}

function parseDisciplinas(text: string): HistoricoDisciplinaEntry[] {
  const section = extractCursadosSection(text) ?? text;
  const lines = section
    .split(/\r?\n/)
    .map((line) => line.replace(/\t/g, " ").trimEnd())
    .filter((line) => line.trim().length > 0);

  const disciplinas: HistoricoDisciplinaEntry[] = [];
  
  for (const line of lines) {
    if (SEMESTRE_RE.test(line)) {
      // A linha perfeita: 2024.1 [*] G05CFVR1. [01] CÁLCULO... [Professor (Xh)] 90 75 01 96,0 96.0 A APR
      
      // Extrair semestre e código
      const semestreMatch = line.match(SEMESTRE_RE);
      if (!semestreMatch) continue;
      const semestre = semestreMatch[1];
      
      const codigoMatch = line.match(/(?:^|\s)(G[T]?05[A-Z0-9]{3,7}\.?(?:0\d|\d)?)(?:\s|$)/);
      if (!codigoMatch) continue;
      const codigo = codigoMatch[1];

      // Extrair situação (sempre a última palavra)
      const situacaoMatch = line.match(new RegExp(`\\b(${SITUACAO_RE.source})$`, 'i'));
      const situacao = situacaoMatch ? situacaoMatch[1].toUpperCase() : "MATR"; // Padrão para MATR se não houver stats (cursando)

      // Extrair estatísticas (CH, Hora Aula, Freq, Média, Conceito)
      const statsMatch = line.match(/\s+(\d+)\s+(\d+)\s+\d+(?:\s+([\d,]+)\s+([\d.]+)\s+([A-E]))?(?:\s+[a-zA-Z]{3,7})$/);
      let ch = 0;
      let horaAula = 0;
      let frequencia = null;
      let media = null;
      let conceito = null;
      const optativo = /(?:^|\s)\*\s/.test(line.slice(0, 20));

      if (statsMatch) {
        ch = parseInt(statsMatch[1], 10);
        horaAula = parseInt(statsMatch[2], 10);
        if (statsMatch[3]) frequencia = parseFloat(statsMatch[3].replace(',', '.'));
        if (statsMatch[4]) media = parseFloat(statsMatch[4]);
        if (statsMatch[5]) conceito = statsMatch[5];
      }

      // Limpar a linha para extrair apenas o nome
      let nome = line;
      nome = nome.replace(semestre, ""); // Remove semestre
      nome = nome.replace(/(?:^|\s)\*\s/, " "); // Remove asterisco de optativa
      nome = nome.replace(codigo, ""); // Remove código
      // Remove a versão/crédito estranho após o código (ex: 01, 1, 9.1) que fica no começo
      nome = nome.replace(/^\s*(?:[\d\.]+)\s+/, ""); 
      
      // Remove as estatísticas do final (ex: 60 50 01 90,0 58.0 E REP) ou parciais (ex: 60 50 01)
      nome = nome.replace(/\s+\d+\s+\d+\s+\d+(?:\s+[\d,]+\s+[\d.]+\s+[A-E])?(?:\s+[a-zA-Z]{3,7})?$/, "");
      
      // Remove título de professores conhecidos
      nome = nome.replace(/\s+(?:MSc\.|Dr\.|Dra\.|Prof\.|Me\.|Ma\.).*$/, "");
      // Remove (XXh) que possa ter sobrado no final (professores sem título)
      nome = nome.replace(/\s*\(\d+h\)[,\s]*$/, "");
      
      nome = nome.trim();

      disciplinas.push({
        semestre,
        codigo,
        nome,
        situacao,
        ch,
        horaAula,
        frequencia,
        media,
        conceito,
        optativo,
      });
    } else if (disciplinas.length > 0 && !METADATA_LINE.test(line) && !line.includes("Carga Horária Integralizada") && !line.includes("Atividades") && !line.includes("Assinatura")) {
      // Continuação de uma disciplina que quebrou de linha no PDF!
      const last = disciplinas[disciplinas.length - 1];
      let extra = line.replace(/\s+(?:MSc\.|Dr\.|Dra\.|Prof\.|Me\.|Ma\.).*$/, "");
      extra = extra.replace(/\s*\(\d+h\)[,\s]*$/, "").trim();
      
      // Não adiciona se for lixo como números ou "APR" soltos
      if (extra.length > 0 && !/^[\d\.,\s]+$/.test(extra) && !SITUACAO_RE.test(extra)) {
        last.nome += " " + extra;
      }
    }
  }

  return dedupeDisciplinas(disciplinas);
}

function findDisciplinaStart(
  lines: string[],
  fromIndex: number
): { blockStart: number; semestre: string; nomeSeed: string } | null {
  for (let index = fromIndex; index < lines.length; index += 1) {
    const line = lines[index].trim();
    const semestreMatch = line.match(SEMESTRE_RE);
    if (!semestreMatch) continue;

    const semestre = semestreMatch[1];
    const inlineNome = semestreMatch[2]?.trim() ?? "";

    if (METADATA_LINE.test(inlineNome) || METADATA_LINE.test(line)) continue;
    if (/^PARTICIPAÇÕES NO ENADE/i.test(inlineNome)) continue;
    if (!inlineNome && !looksLikeDisciplinaAhead(lines, index)) continue;

    return {
      blockStart: index,
      semestre,
      nomeSeed: inlineNome,
    };
  }

  return null;
}

function looksLikeDisciplinaAhead(lines: string[], index: number): boolean {
  const window = lines.slice(index + 1, index + 6);
  return window.some(
    (line) =>
      PROFESSOR_LINE.test(line) ||
      /^G[T]?05/i.test(line.trim()) ||
      (/^[A-ZÁÉÍÓÚÂÊÔÃÕÇ]/.test(line) && !METADATA_LINE.test(line))
  );
}

function findDisciplinaEnd(lines: string[], fromIndex: number): number {
  for (let index = fromIndex; index < lines.length; index += 1) {
    const line = lines[index].trim();

    if (/^PARTICIPAÇÕES NO ENADE/i.test(line)) return index;
    if (/^Componentes\s+Curriculares/i.test(line)) return index;
    if (/^Página\s+\d+/i.test(line)) return index;

    const semestreMatch = line.match(SEMESTRE_RE);
    if (!semestreMatch) continue;
    if (METADATA_LINE.test(line)) continue;

    const inlineNome = semestreMatch[2]?.trim() ?? "";
    if (inlineNome && !METADATA_LINE.test(inlineNome)) return index;
    if (!inlineNome && looksLikeDisciplinaAhead(lines, index)) return index;
  }

  return lines.length;
}

function parseDisciplinaBlock(
  blockLines: string[],
  semestre: string,
  nomeSeed: string
): HistoricoDisciplinaEntry | null {
  const block = blockLines.join("\n");
  const situacao = extractSituacaoFromBlock(block);
  if (!situacao) return null;

  const codigo = mergeCodigoFromBlock(block);
  const nome = extractNomeFromBlock(blockLines, semestre, nomeSeed);
  const stats = extractStatsFromBlock(block);

  if (!nome || nome.length < 3) return null;

  return {
    codigo: codigo ?? "",
    nome,
    semestre,
    horaAula: stats.horaAula,
    ch: stats.ch,
    frequencia: stats.frequencia,
    media: stats.media,
    conceito: stats.conceito,
    situacao,
    optativo: stats.optativo,
  };
}

/**
 * Situação pode estar na mesma linha do professor ou em linha separada (layout variável).
 */
function extractSituacaoFromBlock(block: string): string | null {
  const patterns = [
    new RegExp(`\\(\\d+h\\)[^\\n]*?\\s\\d{2}\\s+(${SITUACAO_RE.source})\\b`, "i"),
    new RegExp(`(?:^|\\n)\\s*\\d{2}\\s+(${SITUACAO_RE.source})\\s*(?:\\n|$)`, "im"),
    new RegExp(`\\b(${SITUACAO_RE.source})\\b(?:\\s*\\n\\s*G[T]?05)`, "i"),
  ];

  for (const pattern of patterns) {
    const match = block.match(pattern);
    if (match?.[1]) return match[1].toUpperCase();
  }

  return null;
}

function extractNomeFromBlock(
  blockLines: string[],
  semestre: string,
  nomeSeed: string
): string {
  const nomeLines: string[] = nomeSeed ? [nomeSeed] : [];
  let passedSemestre = !nomeSeed;
  const INLINE_SITUACAO_RE = new RegExp(`\\b\\d{2}\\s+(?:${SITUACAO_RE.source}).*`, "i");

  for (const rawLine of blockLines) {
    const line = rawLine.trim();
    if (!line) continue;

    if (line.startsWith(semestre)) {
      const rest = line.slice(semestre.length).trim();
      if (rest && !nomeSeed) nomeLines.push(rest);
      passedSemestre = true;
      continue;
    }

    if (!passedSemestre) continue;
    if (PROFESSOR_LINE.test(line)) break;
    if (/\(\d+h\)/i.test(line)) break;
    if (/^G[T]?05/i.test(line)) break;
    if (/^\d{2}\s+(?:APR|REP|MATR|TRANC|DISP)/i.test(line)) break;
    if (/^\d+\s+[\d,.]+/.test(line)) break;
    if (METADATA_LINE.test(line)) break;
    if (/^PARTICIPAÇÕES NO ENADE/i.test(line)) break;

    const match = line.match(INLINE_SITUACAO_RE);
    if (match) {
      const cleanLine = line.slice(0, match.index).trim();
      if (cleanLine) nomeLines.push(cleanLine);
      break;
    }

    nomeLines.push(line);
  }

  return nomeLines
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function mergeCodigoFromBlock(block: string): string | null {
  const compact = block.replace(/\r?\n/g, " ").replace(/\s+/g, " ");
  const inline = compact.match(/(G[T]?05[A-Z0-9]+(?:\.\d+)?)/i);
  if (inline) return inline[1].toUpperCase();

  const lines = block.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);

  for (let index = 0; index < lines.length; index += 1) {
    const codeMatch = lines[index].match(/^(G[T]?05[A-Z0-9.]+)/i);
    if (!codeMatch) continue;

    let codigo = codeMatch[1].replace(/\s/g, "");
    const nextLine = lines[index + 1]?.trim() ?? "";
    const fragmentMatch = nextLine.match(/^([\d.]+)\s/);

    if (fragmentMatch) {
      const fragment = fragmentMatch[1];
      if (codigo.endsWith(".")) {
        codigo += fragment.replace(/^\./, "");
      } else if (/^\d+\.\d+$/.test(fragment)) {
        codigo = codigo.replace(/0+$/, "") + fragment.replace(".", "");
      } else {
        codigo += codigo.includes(".") ? fragment : `.${fragment}`;
      }
    }

    return codigo.toUpperCase();
  }

  return null;
}

function extractStatsFromBlock(block: string): {
  ch: number;
  horaAula: number;
  frequencia: number | null;
  media: number | null;
  conceito: string | null;
  optativo: boolean;
} {
  const statsMatch = block.match(
    /G[T]?05[A-Z0-9.]+\s+(\d{2,})\s+([\d,.]+|--)\s+([\d,.-]+|--)(?:\s+(\*))?(?:\s+(\d+))?(?:\s+([A-F]|--))?/i
  );

  if (!statsMatch) {
    const fallback = block.match(
      /(?:^|\n)\s*(?:[\d.]+\s+)?(\d{2,})\s+([\d,.]+|--)\s+([\d,.-]+|--)(?:\s+(\*))?(?:\s+(\d+))?(?:\s+([A-F]|--))?/m
    );
    if (!fallback) {
      return {
        ch: 0,
        horaAula: 0,
        frequencia: null,
        media: null,
        conceito: null,
        optativo: false,
      };
    }
    return mapStatsMatch(fallback);
  }

  return mapStatsMatch(statsMatch);
}

function mapStatsMatch(match: RegExpMatchArray): {
  ch: number;
  horaAula: number;
  frequencia: number | null;
  media: number | null;
  conceito: string | null;
  optativo: boolean;
} {
  return {
    ch: parseNum(match[1]) ?? 0,
    frequencia: parseNum(match[2]),
    media: parseNum(match[3]),
    optativo: match[4] === "*",
    horaAula: parseNum(match[5]) ?? 0,
    conceito: match[6] && match[6] !== "--" ? match[6] : null,
  };
}

function dedupeDisciplinas(
  entries: HistoricoDisciplinaEntry[]
): HistoricoDisciplinaEntry[] {
  const byKey = new Map<string, HistoricoDisciplinaEntry>();

  for (const entry of entries) {
    const key = `${entry.semestre}|${entry.codigo || entry.nome}|${entry.situacao}`;
    const existing = byKey.get(key);
    if (!existing || entry.ch > existing.ch) {
      byKey.set(key, entry);
    }
  }

  return Array.from(byKey.values());
}

function parseNum(value: string | undefined): number | null {
  if (!value || value === "--") return null;
  const normalized = value.replace(",", ".");
  const num = Number.parseFloat(normalized);
  return Number.isFinite(num) ? num : null;
}

function extractCursadosSection(text: string): string | null {
  const start = text.search(/Componentes\s+Curriculares\s+Cursados/i);
  if (start < 0) return null;

  const endMarkers = [
    text.search(/Componentes\s+Curriculares\s+Obrigat[oó]rios\s+Pendentes/i),
    text.search(/Componentes\s+Curriculares\s+Pendentes/i),
  ].filter((index) => index > start);

  const end = endMarkers.length > 0 ? Math.min(...endMarkers) : text.length;
  let section = text.slice(start, end);

  section = section
    .replace(/Componentes\s+Curriculares\s+Cursados\/Cursando/gi, "")
    .replace(
      /Ano\/Período[\s\S]*?Hora\s*\n\s*Aula\s+Conceito/gi,
      ""
    )
    .replace(/MINISTÉRIO DA EDUCAÇÃO[\s\S]*?SECRETARIA[^\n]*\n/gi, "")
    .replace(/Página\s+\d+\s+de[\s\S]*?código de verificação:[^\n]+\n?/gi, "")
    .replace(/PARTICIPAÇÕES NO ENADE[\s\S]*?(?=\n\d{4}\.\d|\n*$)/gi, "");

  return section.trim() || null;
}

function parseChResumo(text: string): {
  chResumo: HistoricoChResumo[];
  chTotais?: HistoricoChTotais;
} {
  const anchor = text.search(/\bExigido\b[\s\S]{0,40}\bIntegralizado\b/);
  if (anchor < 0) return { chResumo: [] };

  const section = text.slice(anchor, anchor + 500);
  const hourValues = [...section.matchAll(/(\d+)\s*h/gi)].map((match) =>
    Number.parseInt(match[1], 10)
  );

  if (hourValues.length < 18) return { chResumo: [] };

  const specs = [
    { tipo: "Optativa", exigido: 0, integralizado: 1, pendente: 2 },
    { tipo: "Obrigatória", exigido: 8, integralizado: 7, pendente: 6 },
    { tipo: "Complementar", exigido: 11, integralizado: 10, pendente: 9 },
    { tipo: "Flexibilizada", exigido: 14, integralizado: 13, pendente: 12 },
    { tipo: "Extensão", exigido: 17, integralizado: 16, pendente: 15 },
  ];

  const chResumo = specs.map(({ tipo, exigido, integralizado, pendente }) => ({
    tipo,
    exigido: hourValues[exigido] ?? 0,
    integralizado: hourValues[integralizado] ?? 0,
    pendente: hourValues[pendente] ?? 0,
  }));

  const chTotais: HistoricoChTotais = {
    exigido: hourValues[3] ?? 0,
    integralizado: hourValues[4] ?? 0,
    pendente: hourValues[5] ?? 0,
  };

  return { chResumo, chTotais };
}
