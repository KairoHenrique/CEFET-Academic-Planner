/**
 * Renomeia rótulos de eventos do calendário acadêmico apenas para exibição.
 * O nome bruto do SIGAA continua salvo no banco (o scraper, o filtro de eventos
 * e a resolução de semestre/período seguem casando com o texto original).
 *
 * - "Matrícula OnLine"           → "Matrícula Fase 1"
 * - "Rematrícula"                → "Matrícula Fase 2"
 * - "Processamento de Matrícula" → "Resultado Matrícula Fase 1"
 * - "Processamento de Rematrícula" → "Resultado Matrícula Fase 2"
 */

/** Normaliza p/ chave — resistente a acento, caixa, espaços e `:` final. */
function normalizeEventKey(label: string): string {
  return label
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/:$/, "")
    .trim();
}

const EVENT_LABEL_OVERRIDES: Record<string, string> = {
  "matricula online": "Matrícula Fase 1",
  rematricula: "Matrícula Fase 2",
  "processamento de matricula": "Resultado Matrícula Fase 1",
  "processamento de rematricula": "Resultado Matrícula Fase 2",
};

/** Retorna o rótulo renomeado, ou `null` se não houver override. */
export function resolveEventLabelOverride(label: string): string | null {
  return EVENT_LABEL_OVERRIDES[normalizeEventKey(label)] ?? null;
}
