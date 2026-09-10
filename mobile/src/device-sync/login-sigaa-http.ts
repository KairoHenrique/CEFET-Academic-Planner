import {
  SIGAA_LOGIN_URL,
  SIGAA_PORTAL_DISCENTE_URL,
} from "./constants";
import type { DeviceHttpSession } from "./http-session";

const LOGIN_ERROR_PATTERN =
  /inv[aá]lid|incorret|autentica[cç][aã]o|n[aã]o foi poss[ií]vel|falha na autentica/i;

function extractViewState(html: string): string | null {
  const match =
    html.match(
      /name=["']javax\.faces\.ViewState["'][^>]*value=["']([^"']+)["']/i
    ) ??
    html.match(
      /value=["']([^"']+)["'][^>]*name=["']javax\.faces\.ViewState["']/i
    );
  return match?.[1] ?? null;
}

function looksLoggedIn(html: string, url: string): boolean {
  if (/verTelaLogin\.do/i.test(url) && /name=["']password["']/i.test(html)) {
    return false;
  }
  return (
    /portal.?do.?discente|turma.?virtual|menu.?discente|sair/i.test(html) ||
    /portais\/discente/i.test(url)
  );
}

export class DeviceSyncError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "DeviceSyncError";
    this.code = code;
  }
}

/**
 * Login SIGAA via HTTP form POST no aparelho (IP do aluno).
 */
export async function loginSigaaHttp(
  session: DeviceHttpSession,
  credentials: { username: string; password: string }
): Promise<void> {
  const username = credentials.username.trim();
  const password = credentials.password;
  if (!username || !password) {
    throw new DeviceSyncError(
      "INVALID_CREDENTIALS",
      "Informe usuário e senha do SIGAA."
    );
  }

  const loginPage = await session.request(SIGAA_LOGIN_URL, { method: "GET" });
  if (!loginPage.response.ok) {
    throw new DeviceSyncError(
      "SIGAA_OFFLINE",
      "Não foi possível conectar ao SIGAA. Tente novamente em alguns minutos."
    );
  }

  const body = new URLSearchParams();
  body.set("username", username);
  body.set("password", password);
  body.set("dispatch", "logOn");

  const submitted = await session.request(SIGAA_LOGIN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Referer: SIGAA_LOGIN_URL,
    },
    body: body.toString(),
    redirect: "follow",
  });

  if (LOGIN_ERROR_PATTERN.test(submitted.text)) {
    throw new DeviceSyncError(
      "INVALID_CREDENTIALS",
      "Usuário ou senha inválidos. Verifique suas credenciais do SIGAA."
    );
  }

  await dismissPendingNotificationsHttp(session, password);

  const portal = await session.request(SIGAA_PORTAL_DISCENTE_URL, {
    method: "GET",
    headers: { Referer: SIGAA_LOGIN_URL },
  });

  if (
    LOGIN_ERROR_PATTERN.test(portal.text) ||
    !looksLoggedIn(portal.text, portal.url || SIGAA_PORTAL_DISCENTE_URL)
  ) {
    throw new DeviceSyncError(
      "INVALID_CREDENTIALS",
      "Usuário ou senha inválidos. Verifique suas credenciais do SIGAA."
    );
  }
}

async function dismissPendingNotificationsHttp(
  session: DeviceHttpSession,
  password: string
): Promise<void> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const page = await session.request(SIGAA_PORTAL_DISCENTE_URL, {
      method: "GET",
    });
    const html = page.text;
    if (
      !/notificacoes_academicas|notificacoes_pendentes/i.test(html) &&
      !/confirmar\s+leitura|estou\s+ciente/i.test(html)
    ) {
      return;
    }

    const viewState = extractViewState(html);
    const formBody = new URLSearchParams();
    if (viewState) {
      formBody.set("javax.faces.ViewState", viewState);
    }
    formBody.set("senha", password);
    formBody.set("password", password);

    const actionMatch = html.match(
      /action=["']([^"']*notificacoes_pendentes[^"']*)["']/i
    );
    const action = actionMatch?.[1]
      ? new URL(actionMatch[1], "https://sig.cefetmg.br").toString()
      : page.url;

    await session.request(action, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Referer: page.url,
      },
      body: formBody.toString(),
      redirect: "follow",
    });
  }
}
