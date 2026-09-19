import { resolveAppUrl } from "@/lib/email/email-links";
import { resolveLegalContactEmail } from "@/lib/legal/constants";

/**
 * Renderiza o HTML dos e-mails transacionais a partir do texto simples já
 * existente na fila (`body_text`), evitando migration na tabela.
 *
 * Layout: cabeçalho azul-marinho com a logo do site, corpo em card branco,
 * botão de ação dourado (quando o parágrafo é só uma URL) e rodapé com contato.
 *
 * Segurança: todo o conteúdo dinâmico passa por `escapeHtml` antes de virar
 * markup (defesa contra HTML/XSS caso um campo do usuário chegue ao corpo).
 * URLs `http(s)` são convertidas em links seguros (linkify pós-escape).
 */
const BRAND = "ACME HUB";
const TAGLINE = "Planejador acadêmico · CEFET-MG";
const GOLD = "#c9a227";
const NAVY = "#0b1220";
const URL_PATTERN = /(https?:\/\/[^\s<]+)/g;
const STANDALONE_URL_PATTERN = /^https?:\/\/[^\s<]+$/;

/** CID usado no SMTP Gmail (anexo inline) — Gmail bloqueia img remota em alguns hosts. */
export const ACCOUNT_EMAIL_LOGO_CID = "acme-logo";

export interface RenderAccountEmailHtmlOptions {
  /**
   * Src da logo no `<img>`. Use `cid:acme-logo` no envio SMTP (anexo).
   * Default: URL absoluta pública (`/logo_v2.png`).
   */
  logoSrc?: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function safeHref(rawUrl: string): string {
  return rawUrl.replace(/&amp;/g, "&").replace(/"/g, "%22");
}

/** Rótulo amigável do botão conforme o destino da URL. */
function resolveCtaLabel(url: string): string {
  if (/\/planos\/?$/.test(url)) return "Ver planos";
  if (/\/dashboard\/?$/.test(url)) return "Acessar o ACME HUB";
  return "Abrir";
}

/** Recebe uma linha JÁ escapada e transforma URLs em âncoras inline. */
function linkifyEscapedLine(escapedLine: string): string {
  return escapedLine.replace(URL_PATTERN, (rawUrl) => {
    return `<a href="${safeHref(rawUrl)}" style="color:${GOLD};text-decoration:underline;word-break:break-all;">${rawUrl}</a>`;
  });
}

/** Botão de ação "bulletproof" (table-based) + link de fallback. */
function renderCtaButton(rawUrl: string): string {
  const href = safeHref(rawUrl);
  const label = resolveCtaLabel(rawUrl);
  return `<table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:4px auto 6px;">
    <tr>
      <td align="center" style="border-radius:10px;background:${GOLD};">
        <a href="${href}" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:700;color:${NAVY};text-decoration:none;border-radius:10px;">${label}</a>
      </td>
    </tr>
  </table>
  <p style="margin:8px 0 20px;text-align:center;font-size:12px;color:#9ca3af;">ou acesse: <a href="${href}" style="color:#6b7280;text-decoration:underline;word-break:break-all;">${rawUrl}</a></p>`;
}

/** Linhas em branco separam parágrafos; blocos que são só URL viram botão. */
function renderBody(bodyText: string): string {
  return bodyText
    .split(/\n{2,}/)
    .map((block) => {
      const trimmed = block.trim();
      if (STANDALONE_URL_PATTERN.test(trimmed)) {
        return renderCtaButton(trimmed);
      }

      const inner = block
        .split("\n")
        .map((line) => linkifyEscapedLine(escapeHtml(line)))
        .join("<br />");
      return `<p style="margin:0 0 16px;line-height:1.65;color:#1f2937;font-size:15px;">${inner}</p>`;
    })
    .join("");
}

function renderHeader(logoSrc: string): string {
  return `<tr>
    <td align="center" style="background:linear-gradient(135deg,#013a72,#001426);padding:32px 32px 26px;">
      <img src="${logoSrc}" width="72" height="64" alt="${BRAND}" style="display:block;border:0;outline:none;text-decoration:none;height:64px;width:auto;margin:0 auto 12px;" />
      <div style="color:${GOLD};font-size:22px;font-weight:800;letter-spacing:1px;font-family:'Segoe UI',Arial,sans-serif;">${BRAND}</div>
      <div style="color:#c7d2e0;font-size:12px;letter-spacing:0.4px;margin-top:4px;">${TAGLINE}</div>
    </td>
  </tr>`;
}

function renderFooter(year: number): string {
  const contactEmail = resolveLegalContactEmail();
  const plansUrl = resolveAppUrl("/planos");
  return `<tr>
    <td style="padding:8px 32px 30px;background:#f8fafc;">
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:0 0 16px;" />
      <p style="margin:0 0 6px;font-size:12px;line-height:1.6;color:#6b7280;">
        Dúvidas? Fale com a gente:
        <a href="mailto:${contactEmail}" style="color:${GOLD};text-decoration:none;font-weight:600;">${contactEmail}</a>
      </p>
      <p style="margin:0;font-size:12px;line-height:1.6;color:#9ca3af;">
        Você recebeu este e-mail porque tem uma conta no ${BRAND} (planejador acadêmico do CEFET-MG).<br />
        Gerencie seu plano em <a href="${plansUrl}" style="color:#6b7280;text-decoration:underline;">${plansUrl}</a><br />
        &copy; ${year} ${BRAND}. Não oficial do CEFET-MG.
      </p>
    </td>
  </tr>`;
}

export function renderAccountEmailHtml(
  subject: string,
  bodyText: string,
  options?: RenderAccountEmailHtmlOptions
): string {
  const safeSubject = escapeHtml(subject);
  const body = renderBody(bodyText);
  const year = new Date().getFullYear();
  const logoSrc =
    options?.logoSrc?.trim() || resolveAppUrl("/logo_v2.png");

  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light" />
    <title>${safeSubject}</title>
  </head>
  <body style="margin:0;padding:0;background:${NAVY};font-family:'Segoe UI',Roboto,Arial,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${safeSubject}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${NAVY};padding:28px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 12px 40px rgba(0,0,0,0.35);">
            ${renderHeader(logoSrc)}
            <tr>
              <td style="padding:30px 32px 8px;">
                <h1 style="margin:0 0 20px;font-size:20px;line-height:1.35;color:${NAVY};font-weight:700;">${safeSubject}</h1>
                ${body}
              </td>
            </tr>
            ${renderFooter(year)}
          </table>
          <p style="max-width:600px;margin:16px auto 0;font-size:11px;color:#5b6b82;text-align:center;">
            ${BRAND} · ${TAGLINE}
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
