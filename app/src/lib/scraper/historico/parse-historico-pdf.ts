import type {
  HistoricoDisciplinaEntry,
  HistoricoChResumo,
  HistoricoSnapshot,
} from "@/lib/scraper/types/historico";

/**
 * Situações válidas do histórico SIGAA CEFET.
 * Se encontrar uma situação desconhecida, inclui como-está.
 */
const SITUACOES_VALIDAS = new Set([
  "APR", "APRN", "REP", "REPF", "REPMF", "REPN", "REPNF",
  "TRANC", "MATR", "DISP", "CANC", "CUMP", "TRANS", "INCORP", "REC",
]);

/**
 * Regex para extrair linhas de componentes curriculares do texto do PDF.
 * 
 * Layout do PDF do SIGAA CEFET:
 * ```
 * 2024.1  G05CFVR1.01  CÁLCULO COM FUNÇÕES DE UMA VARIÁVEL REAL  90  75  01  100,0  21.0  F  REP
 * 2024.2  *  G05IINT1.01  INGLÊS INSTRUMENTAL I  30  25  01  93,0  86.0  B  APR
 * ```
 * 
 * O texto extraído pelo pdf-parse fica tudo junto, com quebras de linha irregulares.
 * Usamos uma abordagem por seções: encontrar cada "bloco" de disciplina.
 */

const SEMESTRE_PATTERN = /\b(2\d{3}\.\d)\b/;
const CODIGO_PATTERN = /\b(G\d{2}[A-Z0-9.]+\d)\b/;
const SITUACAO_PATTERN = /\b(APR|APRN|REP|REPF|REPMF|REPN|REPNF|TRANC|MATR|DISP|CANC|CUMP|TRANS|INCORP|REC)\b/;
const NUMERO_PATTERN = /\b(\d+[,.]?\d*)\b/;

/**
 * Parseia o texto extraído do PDF do histórico escolar.
 * O pdf-parse retorna todo o texto do PDF como uma string.
 */
export function parseHistoricoPdfText(text: string): HistoricoSnapshot {
  const disciplinas = parseDisciplinas(text);
  const chResumo = parseChResumo(text);

  return {
    scrapedAt: new Date().toISOString(),
    disciplinas,
    chResumo,
  };
}

/**
 * Extrai disciplinas da seção "Componentes Curriculares Cursados/Cursando".
 * 
 * O texto do PDF tem linhas como:
 * ```
 * 2024.2  G05IINT1.01  INGLÊS INSTRUMENTAL I  30  25  01  93,0  86.0  B  APR
 * ```
 * 
 * Mas o pdf-parse pode quebrar linhas de formas imprevisíveis.
 * Estratégia: encontrar cada semestre + código + situação e pegar tudo entre eles.
 */
function parseDisciplinas(text: string): HistoricoDisciplinaEntry[] {
  const disciplinas: HistoricoDisciplinaEntry[] = [];

  // Extrair a seção de componentes cursados
  const cursadosSection = extractCursadosSection(text);
  if (!cursadosSection) return disciplinas;

  // Tokenizar: encontrar cada bloco semestre..situação
  const blocks = splitIntoDisciplinaBlocks(cursadosSection);

  for (const block of blocks) {
    const parsed = parseDisciplinaBlock(block);
    if (parsed) {
      disciplinas.push(parsed);
    }
  }

  return disciplinas;
}

function extractCursadosSection(text: string): string | null {
  // A seção começa com "Componentes Curriculares Cursados/Cursando"
  // e termina com "Legenda" ou "Carga Horária Integralizada"
  const startMatch = text.match(/Componentes\s+Curriculares\s+Cursados/i);
  if (!startMatch) return null;

  const startIdx = startMatch.index! + startMatch[0].length;
  const endMatch = text.slice(startIdx).match(/(?:Legenda|Carga\s+Hor[aá]ria\s+Integralizada|Componentes\s+Curriculares\s+Obrigat[oó]rios\s+Pendentes)/i);
  const endIdx = endMatch ? startIdx + endMatch.index! : text.length;

  return text.slice(startIdx, endIdx);
}

/**
 * Divide a seção de cursados em blocos, um por disciplina.
 * Cada bloco começa com um semestre (2024.1) e termina com uma situação (APR/REP/etc).
 */
function splitIntoDisciplinaBlocks(section: string): string[] {
  const blocks: string[] = [];

  // Regex global para encontrar cada ocorrência de situação
  const situacaoGlobal = new RegExp(
    `\\b(${Array.from(SITUACOES_VALIDAS).join("|")})\\b`,
    "g"
  );

  let lastEnd = 0;
  let match: RegExpExecArray | null;

  while ((match = situacaoGlobal.exec(section)) !== null) {
    const situacaoEnd = match.index + match[0].length;
    const candidate = section.slice(lastEnd, situacaoEnd).trim();

    // Verificar se contém semestre + código (é uma disciplina válida)
    if (SEMESTRE_PATTERN.test(candidate) && CODIGO_PATTERN.test(candidate)) {
      blocks.push(candidate);
      lastEnd = situacaoEnd;
    }
  }

  return blocks;
}

function parseDisciplinaBlock(block: string): HistoricoDisciplinaEntry | null {
  const semestreMatch = block.match(SEMESTRE_PATTERN);
  const codigoMatch = block.match(CODIGO_PATTERN);
  const situacaoMatch = block.match(SITUACAO_PATTERN);

  if (!semestreMatch || !codigoMatch || !situacaoMatch) return null;

  const semestre = semestreMatch[1];
  const codigo = codigoMatch[1];
  const situacao = situacaoMatch[1];
  const optativo = /\*/.test(block.slice(0, codigoMatch.index!));

  // Extrair nome: tudo entre o código e os números finais
  const afterCodigo = block.slice(codigoMatch.index! + codigoMatch[0].length);
  const nome = extractNome(afterCodigo, situacao);

  // Extrair números no final do bloco (hora_aula, ch, turma, freq, média, conceito)
  const numbers = extractTrailingNumbers(afterCodigo, situacao);

  return {
    codigo,
    nome,
    semestre,
    horaAula: numbers.horaAula,
    ch: numbers.ch,
    frequencia: numbers.frequencia,
    media: numbers.media,
    conceito: numbers.conceito,
    situacao,
    optativo,
  };
}

function extractNome(afterCodigo: string, situacao: string): string {
  // O nome está entre o código e a sequência de números
  // Encontrar onde começam os números consistentes (hora_aula ch turma freq media conceito situacao)
  const numbersPattern = /\d+\s+\d+\s+\d+\s+[\d,.-]+\s+[\d,.-]+\s+[A-F-]+\s+/i;
  const numbersMatch = afterCodigo.match(numbersPattern);

  let nome: string;
  if (numbersMatch) {
    nome = afterCodigo.slice(0, numbersMatch.index!);
  } else {
    // Fallback: pegar até a situação
    const sitIdx = afterCodigo.lastIndexOf(situacao);
    // Pegar texto antes dos números finais
    const beforeSit = afterCodigo.slice(0, sitIdx);
    // Remover números e conceitos do final
    nome = beforeSit.replace(/[\d,.\s]+[A-F-]*\s*$/i, "");
  }

  return nome
    .replace(/\s+/g, " ")
    .replace(/^[^A-ZÀ-Ú]+/i, "")
    .trim();
}

function extractTrailingNumbers(
  afterCodigo: string,
  situacao: string
): {
  horaAula: number;
  ch: number;
  frequencia: number | null;
  media: number | null;
  conceito: string | null;
} {
  // Encontrar a situação e pegar os números antes dela
  const sitIdx = afterCodigo.lastIndexOf(situacao);
  if (sitIdx < 0) {
    return { horaAula: 0, ch: 0, frequencia: null, media: null, conceito: null };
  }

  const beforeSit = afterCodigo.slice(0, sitIdx).trim();

  // Os números finais são: horaAula CH turma freq% media conceito
  // Ex: "30 25 01 93,0 86.0 B" ou "30 25 01 -- -- --"
  const tokens = beforeSit.split(/\s+/).filter(Boolean);

  // Pegar os últimos 6 tokens (conceito, media, freq, turma, ch, horaAula)
  const tail = tokens.slice(-6);

  const conceito = isConceito(tail[tail.length - 1]) ? tail[tail.length - 1] : null;
  const conceitoOffset = conceito ? 1 : 0;
  const tailNums = tail.slice(0, tail.length - conceitoOffset);

  // Agora temos [... horaAula, ch, turma, freq, media]
  const mediaRaw = tailNums[tailNums.length - 1];
  const freqRaw = tailNums[tailNums.length - 2];
  // turma = tailNums[tailNums.length - 3]
  const chRaw = tailNums[tailNums.length - 4];
  const horaAulaRaw = tailNums[tailNums.length - 5];

  return {
    horaAula: parseNum(horaAulaRaw) ?? 0,
    ch: parseNum(chRaw) ?? 0,
    frequencia: parseNum(freqRaw),
    media: parseNum(mediaRaw),
    conceito: conceito === "--" ? null : conceito,
  };
}

function isConceito(value: string | undefined): boolean {
  if (!value) return false;
  return /^[A-F]$/.test(value) || value === "--";
}

function parseNum(value: string | undefined): number | null {
  if (!value || value === "--") return null;
  const normalized = value.replace(",", ".");
  const num = Number.parseFloat(normalized);
  return Number.isFinite(num) ? num : null;
}

/**
 * Parseia a tabela "Carga Horária Integralizada/Pendente".
 * 
 * Layout:
 * ```
 * Exigido    3105 h  360 h  375 h  450 h  30 h  4320 h
 * Integralizado 570 h 120 h  0 h    0 h   0 h   690 h
 * Pendente   2535 h  240 h  375 h  450 h  30 h  3630 h
 * ```
 */
function parseChResumo(text: string): HistoricoChResumo[] {
  const resumo: HistoricoChResumo[] = [];

  const startMatch = text.match(/Carga\s+Hor[aá]ria\s+Integralizada\s*\/\s*Pendente/i);
  if (!startMatch) return resumo;

  const section = text.slice(startMatch.index! + startMatch[0].length, startMatch.index! + startMatch[0].length + 600);

  // Tipos de CH na ordem do PDF do CEFET
  const tipos = ["Obrigatória", "Optativa", "Complementar", "Extensão", "Flexibilizada"];

  // Extrair linha Exigido
  const exigidoMatch = section.match(/Exigido\s+([\d\s,h.]+)/i);
  const integralizadoMatch = section.match(/Integralizado\s+([\d\s,h.]+)/i);
  const pendenteMatch = section.match(/Pendente\s+([\d\s,h.]+)/i);

  if (!exigidoMatch || !integralizadoMatch || !pendenteMatch) return resumo;

  const exigidoNums = extractHourValues(exigidoMatch[1]);
  const integralizadoNums = extractHourValues(integralizadoMatch[1]);
  const pendenteNums = extractHourValues(pendenteMatch[1]);

  for (let i = 0; i < tipos.length && i < exigidoNums.length; i++) {
    resumo.push({
      tipo: tipos[i],
      exigido: exigidoNums[i],
      integralizado: integralizadoNums[i] ?? 0,
      pendente: pendenteNums[i] ?? 0,
    });
  }

  return resumo;
}

function extractHourValues(line: string): number[] {
  const matches = line.match(/(\d+)\s*h/g);
  if (!matches) return [];
  return matches.map((m) => {
    const num = m.replace(/[^0-9]/g, "");
    return Number.parseInt(num, 10);
  });
}
