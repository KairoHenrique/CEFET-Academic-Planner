import type { Cookie } from "playwright";

export interface SigaaCredentials {
  username: string;
  password: string;
}

/**
 * Sessão retornada pelo login — usada apenas no modo mock (cookies salvos).
 * No modo live o browser permanece aberto e a sessão é mantida via page.
 */
export interface SigaaSession {
  username: string;
  cookies: Cookie[];
  loggedInAt: string;
}
