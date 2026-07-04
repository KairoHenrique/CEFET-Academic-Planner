import { stripHtmlTags } from "@/lib/scraper/turma-virtual/html-utils";
import { isSolicitacaoTurmasTableHtml } from "@/lib/scraper/turmas-ofertadas/parse-solicitacao-turmas-html";

const TURMAS_OFERTADAS_TITLE =
  /turmas?\s+(?:ofertadas?|abertas?).*(?:pr[oó]xim[oa]|seguinte)|pr[oó]xim[oa]\s+semestre/i;

const SOLICITACAO_TURMAS_TITLE =
  /solicita[çc][ãa]o de abertura de turma|lista de solicita[çc][õo]es/i;

function extractListagemTables(html: string): string[] {
  return Array.from(
    html.matchAll(
      /<table[^>]*class=["'][^"']*listagem[^"']*["'][\s\S]*?<\/table>/gi
    )
  ).map((match) => match[0]);
}

export function isPortalDiscenteHomeForTurmas(html: string): boolean {
  return /Turmas do Semestre|Dados Institucionais|Cadastrar novo t[oó]pico/i.test(
    html
  );
}

export function isTurmasOfertadasPageHtml(html: string): boolean {
  const plain = stripHtmlTags(html).replace(/\s+/g, " ");
  if (TURMAS_OFERTADAS_TITLE.test(plain)) return true;
  if (SOLICITACAO_TURMAS_TITLE.test(plain)) return true;

  // Portal discente (fórum, turmas matriculadas) não é a tela de ofertas.
  if (isPortalDiscenteHomeForTurmas(html)) return false;

  const tables = extractListagemTables(html);
  if (tables.length === 0) return false;

  return tables.some((table) => isSolicitacaoTurmasTableHtml(table));
}
