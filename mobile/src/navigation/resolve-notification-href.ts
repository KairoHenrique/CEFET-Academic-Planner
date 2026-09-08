import type { RootStackParamList } from "./types";
import { navigateFromRoot } from "./navigation-ref";

/**
 * Converte hrefs do site (`/disciplinas/CODE`, `/calendario`, …) em rotas nativas.
 */
export function resolveNotificationHref(href: string): {
  route: keyof RootStackParamList;
  params?: RootStackParamList[keyof RootStackParamList];
} | null {
  const path = href.trim().split("?")[0]?.split("#")[0] ?? "";
  if (!path || path === "/") {
    return { route: "Dashboard" };
  }

  const disciplinaMatch = path.match(/^\/disciplinas\/([^/]+)\/?$/i);
  if (disciplinaMatch?.[1]) {
    const code = decodeURIComponent(disciplinaMatch[1]);
    return { route: "DisciplinaDetail", params: { code } };
  }

  if (path === "/calendario" || path.startsWith("/calendario/")) {
    return { route: "Calendario" };
  }
  if (path === "/disciplinas") {
    return { route: "Disciplinas" };
  }
  if (path === "/integralizacao") {
    return { route: "Integralizacao" };
  }
  if (path === "/mapa") {
    return { route: "Mapa" };
  }
  if (path === "/simulador") {
    return { route: "Simulador" };
  }
  if (path === "/planos" || path.startsWith("/planos/")) {
    return { route: "Dashboard" };
  }
  if (path === "/perfil") {
    return { route: "Perfil" };
  }
  if (path === "/notificacoes") {
    return { route: "Notificacoes" };
  }

  return null;
}

export function navigateFromNotificationHref(href: string): boolean {
  const target = resolveNotificationHref(href);
  if (!target) return false;
  navigateFromRoot(target.route, target.params);
  return true;
}
