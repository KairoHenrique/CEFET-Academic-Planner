/**
 * Renderiza o HTML dos e-mails transacionais a partir do texto simples já
 * existente na fila (`body_text`), evitando migration na tabela.
 *
 * Segurança: todo o conteúdo dinâmico passa por `escapeHtml` antes de virar
 * markup (defesa contra HTML/XSS caso um campo do usuário chegue ao corpo).
 * URLs `http(s)` são convertidas em links seguros (linkify pós-escape).
 */
const BRAND = "ACME HUB";
const GOLD = "#c9a227";
const URL_PATTERN = /(https?:\/\/[^\s<]+)/g;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Recebe uma linha JÁ escapada e transforma URLs em âncoras. */
function linkifyEscapedLine(escapedLine: string): string {
  return escapedLine.replace(URL_PATTERN, (rawUrl) => {
    const href = rawUrl.replace(/&amp;/g, "&");
    const safeHref = href.replace(/"/g, "%22");
    return `<a href="${safeHref}" style="color:${GOLD};text-decoration:underline;word-break:break-all;">${rawUrl}</a>`;
  });
}

/** Linhas em branco separam parágrafos; quebras simples viram <br />. */
function renderBody(bodyText: string): string {
  return bodyText
    .split(/\n{2,}/)
    .map((block) => {
      const inner = block
        .split("\n")
        .map((line) => linkifyEscapedLine(escapeHtml(line)))
        .join("<br />");
      return `<p style="margin:0 0 16px;line-height:1.6;color:#1f2937;font-size:15px;">${inner}</p>`;
    })
    .join("");
}

export function renderAccountEmailHtml(
  subject: string,
  bodyText: string
): string {
  const safeSubject = escapeHtml(subject);
  const body = renderBody(bodyText);
  const year = new Date().getFullYear();

  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light" />
    <title>${safeSubject}</title>
  </head>
  <body style="margin:0;padding:0;background:#0b1220;font-family:'Segoe UI',Arial,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${safeSubject}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0b1220;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.25);">
            <tr>
              <td style="background:linear-gradient(135deg,#00305e,#001a33);padding:24px 32px;">
                <span style="color:${GOLD};font-size:20px;font-weight:700;letter-spacing:0.5px;">${BRAND}</span>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 32px 8px;">
                <h1 style="margin:0 0 20px;font-size:19px;line-height:1.35;color:#0b1220;">${safeSubject}</h1>
                ${body}
              </td>
            </tr>
            <tr>
              <td style="padding:12px 32px 28px;">
                <hr style="border:none;border-top:1px solid #e5e7eb;margin:8px 0 16px;" />
                <p style="margin:0;font-size:12px;line-height:1.5;color:#6b7280;">
                  Você recebeu este e-mail porque tem uma conta no ${BRAND}
                  (planejador acadêmico CEFET-MG).<br />
                  &copy; ${year} ${BRAND}.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
