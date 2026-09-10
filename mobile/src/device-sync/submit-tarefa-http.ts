import {
  SIGAA_BASE_URL,
  SIGAA_PORTAL_DISCENTE_URL,
} from "./constants";
import { DeviceHttpSession } from "./http-session";
import { DeviceSyncError, loginSigaaHttp } from "./login-sigaa-http";
import { getSigaaPassword } from "./sigaa-password-store";
import { getSession } from "../auth/session";

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

function normalizeTitulo(value: string): string {
  return value.replace(/\s+/g, " ").trim().toLowerCase();
}

function findTarefaLinkId(html: string, titulo: string, linkIdHint?: string | null): string | null {
  if (linkIdHint && html.includes(linkIdHint)) return linkIdHint;

  const target = normalizeTitulo(titulo);
  const re =
    /<a[^>]+id=["']([^"']*visualizar(?:Tarefa|Questionario|Avaliacao)[^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null;
  let fallback: string | null = null;
  while ((match = re.exec(html)) !== null) {
    const id = match[1];
    const text = normalizeTitulo(match[2].replace(/<[^>]+>/g, " "));
    if (!id) continue;
    if (text === target || text.includes(target) || target.includes(text)) {
      return id;
    }
    if (!fallback) fallback = id;
  }
  return fallback;
}

const SUCCESS_PATTERN =
  /tarefa\s+enviada|envio\s+realizado|resposta\s+registrada|check\.png|j[aá]\s+enviou\s+sua\s+resposta/i;

export async function submitTarefaOnDevice(input: {
  tarefaTitulo: string;
  sigaaLinkId?: string | null;
  fileUri: string;
  fileName: string;
  fileMime?: string | null;
  comment?: string;
}): Promise<void> {
  const session = getSession();
  const password = await getSigaaPassword();
  if (!session?.cpf || !password) {
    throw new DeviceSyncError(
      "INVALID_CREDENTIALS",
      "Faça login novamente para enviar a tarefa."
    );
  }

  const http = new DeviceHttpSession();
  await loginSigaaHttp(http, {
    username: session.cpf,
    password,
  });

  const portal = await http.request(SIGAA_PORTAL_DISCENTE_URL, { method: "GET" });
  const linkId = findTarefaLinkId(
    portal.text,
    input.tarefaTitulo,
    input.sigaaLinkId
  );
  if (!linkId) {
    throw new DeviceSyncError(
      "SIGAA_SCRAPE_FAILED",
      "Não encontramos esta tarefa no SIGAA. Sincronize e tente de novo."
    );
  }

  const viewState = extractViewState(portal.text);
  const openBody = new URLSearchParams();
  if (viewState) openBody.set("javax.faces.ViewState", viewState);
  openBody.set("formAtividades", "formAtividades");
  openBody.set("formAtividades:_idcl", linkId);
  openBody.set(linkId, linkId);

  const tarefaPage = await http.request(SIGAA_PORTAL_DISCENTE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Referer: SIGAA_PORTAL_DISCENTE_URL,
    },
    body: openBody.toString(),
    redirect: "follow",
  });

  if (!/responderTarefa|type=["']file["']/i.test(tarefaPage.text)) {
    throw new DeviceSyncError(
      "SIGAA_SCRAPE_FAILED",
      "Não foi possível abrir o formulário de envio no SIGAA."
    );
  }

  const fileInputMatch = tarefaPage.text.match(
    /<input[^>]+type=["']file["'][^>]*>/i
  );
  const fileNameAttr =
    fileInputMatch?.[0]?.match(/name=["']([^"']+)["']/i)?.[1] ??
    "form:arquivo";

  const commentName =
    tarefaPage.text.match(
      /<textarea[^>]+name=["']([^"']*coment[^"']*)["']/i
    )?.[1] ?? null;

  const formViewState = extractViewState(tarefaPage.text);
  const formActionMatch = tarefaPage.text.match(
    /<form[^>]+action=["']([^"']+)["'][^>]*>/i
  );
  const action = formActionMatch?.[1]
    ? new URL(formActionMatch[1].replace(/&amp;/g, "&"), SIGAA_BASE_URL).toString()
    : tarefaPage.url;

  const formData = new FormData();
  if (formViewState) {
    formData.append("javax.faces.ViewState", formViewState);
  }

  // Campos hidden comuns do formulário JSF
  const hiddenRe =
    /<input[^>]+type=["']hidden["'][^>]*name=["']([^"']+)["'][^>]*value=["']([^"']*)["'][^>]*>/gi;
  let hidden: RegExpExecArray | null;
  while ((hidden = hiddenRe.exec(tarefaPage.text)) !== null) {
    if (hidden[1] && hidden[1] !== "javax.faces.ViewState") {
      formData.append(hidden[1], hidden[2] ?? "");
    }
  }

  if (commentName && input.comment?.trim()) {
    formData.append(commentName, input.comment.trim());
  }

  const normalizedUri =
    input.fileUri.startsWith("file://") || input.fileUri.startsWith("content://")
      ? input.fileUri
      : `file://${input.fileUri}`;

  formData.append(fileNameAttr, {
    uri: normalizedUri,
    name: input.fileName,
    type: input.fileMime ?? "application/octet-stream",
  } as unknown as Blob);

  // Botão enviar
  const submitName =
    tarefaPage.text.match(
      /<input[^>]+type=["']submit["'][^>]*name=["']([^"']+)["'][^>]*value=["'][^"']*Enviar[^"']*["']/i
    )?.[1] ??
    tarefaPage.text.match(
      /name=["']([^"']+)["'][^>]*value=["'][^"']*Enviar[^"']*["'][^>]*type=["']submit["']/i
    )?.[1];
  if (submitName) {
    formData.append(submitName, "Enviar");
  }

  const submitted = await http.request(action, {
    method: "POST",
    headers: { Referer: tarefaPage.url },
    body: formData,
    redirect: "follow",
  });

  if (
    SUCCESS_PATTERN.test(submitted.text) ||
    !/responderTarefa|type=["']file["']/i.test(submitted.text)
  ) {
    return;
  }

  throw new DeviceSyncError(
    "SIGAA_SCRAPE_FAILED",
    "O SIGAA não confirmou o envio. Verifique o arquivo e o prazo."
  );
}
