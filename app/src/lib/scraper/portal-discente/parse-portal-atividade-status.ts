/** Ícone verde do SIGAA (`/sigaa/img/check.png`) = tarefa/questionário enviado. */
const SUBMITTED_ICON_SRC_PATTERN =
  /(?:^|\/)(?:check|ok|tick|aceito)\.png/i;

const SUBMITTED_TITLE_PATTERN =
  /\b(?:enviad[ao]|entregue|realizad[ao]|conclu[ií]d[ao])\b/i;

const NOT_SUBMITTED_TITLE_PATTERN = /\bn[aã]o\s+enviad/i;

/**
 * Detecta envio a partir da primeira coluna de "Minhas atividades" (ícone de status).
 * Referência: sigaa-api `getActivities()` — `img[src] === '/sigaa/img/check.png'`.
 */
export function isPortalAtividadeEnviada(statusCellHtml: string): boolean {
  const normalized = statusCellHtml.toLowerCase();

  if (SUBMITTED_ICON_SRC_PATTERN.test(normalized)) return true;

  const titleMatch = normalized.match(/title=["']([^"']+)["']/i)?.[1] ?? "";
  if (
    titleMatch &&
    SUBMITTED_TITLE_PATTERN.test(titleMatch) &&
    !NOT_SUBMITTED_TITLE_PATTERN.test(titleMatch)
  ) {
    return true;
  }

  return false;
}
