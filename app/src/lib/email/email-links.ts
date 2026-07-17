/**
 * URLs absolutas para os e-mails transacionais (B62c).
 *
 * Links em e-mail precisam ser absolutos (o cliente de e-mail não resolve
 * caminhos relativos). A base vem do ambiente quando disponível
 * (`PLANNER_APP_URL`), com fallback para o domínio público de produção.
 */
const DEFAULT_APP_BASE_URL = "https://acme-hub.khfm.workers.dev";

export function resolveAppBaseUrl(): string {
  const fromEnv =
    process.env.PLANNER_APP_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim();
  const base = fromEnv || DEFAULT_APP_BASE_URL;
  return base.replace(/\/+$/, "");
}

export function resolveAppUrl(pathname = "/"): string {
  const suffix = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${resolveAppBaseUrl()}${suffix}`;
}

export function resolveRenewUrl(): string {
  return resolveAppUrl("/planos");
}
