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
  
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const semestreMatch = line.match(SEMESTRE_RE);
    
    // Pula até achar o início de uma disciplina (semestre)
    if (!semestreMatch || METADATA_LINE.test(line) || /^PARTICIPAÇÕES NO ENADE/i.test(line)) {
      i++;
      continue;
    }
    
    const semestre = semestreMatch[1];
    const start = i;
    let end = i + 1;
    
    // Escaneia as próximas linhas até encontrar o próximo semestre ou fim da seção
    while (end < lines.length) {
      const nextLine = lines[end];
      if (SEMESTRE_RE.test(nextLine) && !METADATA_LINE.test(nextLine)) {
        break;
      }
      if (/^PARTICIPAÇÕES NO ENADE/i.test(nextLine) || /^Componentes\s+Curriculares/i.test(nextLine) || /^Página\s+\d+/i.test(nextLine)) {
        break;
      }
      end++;
    }
    
    // Pega todas as linhas deste bloco e forma uma string compacta
    const blockLines = lines.slice(start, end);
    const compactBlock = blockLines.join(" ");
    
    // Extração robusta usando Regex global no bloco
    const codigoMatch = compactBlock.match(/(?:^|\s)(G[T]?05[A-Z0-9]+(?:\.\s*\d+|\s*\d+)?)/i);
    const situacaoMatch = compactBlock.match(new RegExp(`\\b(${SITUACAO_RE.source})\\b`, 'i'));
    // CH HoraAula [Turma] [Freq Media Conceito] - Freq sempre tem vírgula!
    const statsMatch = compactBlock.match(/\b(15|30|45|60|75|90|105|120|135|150|240|300|360|420)\s+(\d{2,3})(?:\s+\d{2})?(?:\s+(\d{1,3},\d)\s+([\d.]+)\s+([A-E]))?\b/i);
    
    const codigoBruto = codigoMatch ? codigoMatch[1] : null;
    const codigo = codigoBruto ? codigoBruto.replace(/\s/g, "").toUpperCase() : null;
    const situacao = situacaoMatch ? situacaoMatch[1].toUpperCase() : "MATR"; // Padrão MATR
    const optativo = compactBlock.includes("*") || compactBlock.includes(" * ");
    
    let ch = 0, horaAula = 0, frequencia = null, media = null, conceito = null;
    
    if (statsMatch) {
      ch = parseInt(statsMatch[1], 10);
      horaAula = parseInt(statsMatch[2], 10);
      if (statsMatch[3]) frequencia = parseFloat(statsMatch[3].replace(',', '.'));
      if (statsMatch[4]) media = parseFloat(statsMatch[4]);
      if (statsMatch[5]) conceito = statsMatch[5];
    }
    
    if (codigo) {
      // Limpeza agressiva do nome da matéria
      let nome = compactBlock.replace(semestre, ""); // Remove semestre
      nome = nome.replace(codigoBruto || codigo, ""); // Remove o código original do texto
      nome = nome.replace(/\*/g, ""); // Remove asteriscos
      if (statsMatch) nome = nome.replace(statsMatch[0], ""); // Remove as estatísticas do final
      if (situacaoMatch) nome = nome.replace(new RegExp(`\\b${situacaoMatch[1]}\\b`, 'i'), ""); // Remove a situação
      nome = nome.replace(/\s+(?:MSc\.|Dr\.|Dra\.|Prof\.|Me\.|Ma\.).*$/, ""); // Remove professores no final
      nome = nome.replace(/\s*\(\d+h\)[,\s]*$/, ""); // Remove ch do professor
      nome = nome.replace(/CEFET-MG.*?MINAS GERAIS/i, ""); // Remove rodapé inteiro
      nome = nome.replace(/SISTEMA ACADÊMICO.*?Data de Emissão.*$/i, ""); // Remove rodapé 2
      nome = nome.replace(/^\s*(?:[\d\.]+)\s+/, ""); // Remove número estranho no começo
      nome = nome.replace(/\s*\([^\)]*\)\s*/g, " "); // Remove "(60h)" ou "(Professor)"
      nome = nome.replace(/\s+/g, " ").trim(); // Normaliza espaços
      
      if (nome.length > 2) {
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
      }
    }
    
    i = end;
  }

  return dedupeDisciplinas(disciplinas);
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
    { tipo: "Obrigatória", exigido: 0, integralizado: 3, pendente: 6 },
    { tipo: "Optativa", exigido: 1, integralizado: 4, pendente: 7 },
    { tipo: "Complementar", exigido: 9, integralizado: 13, pendente: 17 },
    { tipo: "Extensão", exigido: 10, integralizado: 14, pendente: 18 },
    { tipo: "Flexibilizada", exigido: 11, integralizado: 15, pendente: 19 },
  ];

  const chResumo = specs.map(({ tipo, exigido, integralizado, pendente }) => ({
    tipo,
    exigido: hourValues[exigido] ?? 0,
    integralizado: hourValues[integralizado] ?? 0,
    pendente: hourValues[pendente] ?? 0,
  }));

  const chTotais: HistoricoChTotais = {
    exigido: hourValues[2] ?? 0,
    integralizado: hourValues[5] ?? 0,
    pendente: hourValues[8] ?? 0,
  };

  return { chResumo, chTotais };
}
