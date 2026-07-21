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
  let index = 0;

  while (index < lines.length) {
    const start = findDisciplinaStart(lines, index);
    if (!start) {
      index += 1;
      continue;
    }

    const end = findDisciplinaEnd(lines, start.blockStart + 1);
    const blockLines = lines.slice(start.blockStart, end);
    const parsed = parseDisciplinaBlock(blockLines, start.semestre, start.nomeSeed);
    if (parsed) disciplinas.push(parsed);

    index = end;
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
  const matches = [...block.matchAll(new RegExp(`\\b(${SITUACAO_RE.source})\\b`, "ig"))];
  if (matches.length > 0) {
    // Retorna o último match encontrado no bloco, pois a situação real costuma ficar no final
    return matches[matches.length - 1][1].toUpperCase();
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
  const chResumo: HistoricoChResumo[] = [];
  let chTotais: HistoricoChTotais | undefined;

  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Identificar cabeçalho de tabela
    if (line.includes("Obrigatórias") || line.includes("Optativos") || line.includes("Complementares")) {
      const currentColumns = line.split(/\s+/).map(c => {
        if (c.includes("Obrigatória")) return "Obrigatória";
        if (c.includes("Optativo")) return "Optativa";
        if (c.includes("Complementar")) return "Complementar";
        if (c.includes("Extensão")) return "Extensão";
        if (c.includes("Flexibilização")) return "Flexibilizada";
        if (c.includes("Total")) return "Total";
        return c;
      });
      
      // Parsear as próximas 3 linhas (Exigido, Integralizado, Pendente)
      if (i + 3 < lines.length) {
        const exigidoLine = lines[i+1];
        const intLine = lines[i+2];
        const pendLine = lines[i+3];
        
        const exigidoVals = [...exigidoLine.matchAll(/(\d+)\s*h/gi)].map(m => parseInt(m[1], 10));
        const intVals = [...intLine.matchAll(/(\d+)\s*h/gi)].map(m => parseInt(m[1], 10));
        const pendVals = [...pendLine.matchAll(/(\d+)\s*h/gi)].map(m => parseInt(m[1], 10));
        
        for (let col = 0; col < currentColumns.length; col++) {
          const tipo = currentColumns[col];
          if (!["Obrigatória", "Optativa", "Complementar", "Extensão", "Flexibilizada", "Total"].includes(tipo)) continue;
          
          const entry = {
            tipo,
            exigido: exigidoVals[col] ?? 0,
            integralizado: intVals[col] ?? 0,
            pendente: pendVals[col] ?? 0
          };
          
          if (tipo === "Total") {
            if (!chTotais || entry.exigido > chTotais.exigido) {
              chTotais = { exigido: entry.exigido, integralizado: entry.integralizado, pendente: entry.pendente };
            }
          } else {
            chResumo.push(entry as HistoricoChResumo);
          }
        }
        
        i += 3; // pular as 3 linhas processadas
      }
    }
  }

  // Preencher os tipos que faltaram com zero
  const requiredTipos = ["Obrigatória", "Optativa", "Complementar", "Extensão", "Flexibilizada"];
  for (const tipo of requiredTipos) {
    if (!chResumo.find(c => c.tipo === tipo)) {
      chResumo.push({ tipo, exigido: 0, integralizado: 0, pendente: 0 } as HistoricoChResumo);
    }
  }

  // Ensure exact output order
  const orderedResumo = requiredTipos.map(tipo => chResumo.find(c => c.tipo === tipo)!);

  return { chResumo: orderedResumo, chTotais };
}
