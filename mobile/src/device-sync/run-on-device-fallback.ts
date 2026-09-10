import { requestJson } from "../auth/api";
import { getSession } from "../auth/session";
import { DeviceHttpSession } from "./http-session";
import { DeviceSyncError, loginSigaaHttp } from "./login-sigaa-http";
import { fetchPortalDiscenteHtml } from "./fetch-portal-html";
import { scrapeRuSaldoHttp } from "./scrape-ru-http";
import { scrapeCalendarioHtmlHttp } from "./scrape-calendario-http";
import { scrapeTurmaVirtualHtmls } from "./scrape-turma-virtual-http";
import { getSigaaPassword } from "./sigaa-password-store";

export type DeviceFallbackProgress = (label: string, progress: number) => void;


/**
 * Sync híbrido no aparelho: SIGAA via IP do aluno → ingest na nuvem.
 * Textos genéricos — sem mencionar aparelho/PC/túnel.
 */
export async function runOnDeviceFallbackSync(
  onProgress: DeviceFallbackProgress
): Promise<void> {
  const session = getSession();
  if (!session?.cpf) {
    throw new DeviceSyncError(
      "UNAUTHORIZED",
      "Sessão inválida. Faça login novamente."
    );
  }

  const password = await getSigaaPassword();
  if (!password) {
    throw new DeviceSyncError(
      "INVALID_CREDENTIALS",
      "Faça login novamente para sincronizar."
    );
  }

  const http = new DeviceHttpSession();

  onProgress("Conectando…", 12);
  await loginSigaaHttp(http, {
    username: session.cpf,
    password,
  });

  onProgress("Lendo dados…", 40);
  const portalHtml = await fetchPortalDiscenteHtml(http);

  onProgress("Atualizando…", 55);
  const refeicoesDisponiveis = await scrapeRuSaldoHttp(http, portalHtml).catch(
    () => null
  );

  onProgress("Atualizando…", 68);
  const calendarioHtml = await scrapeCalendarioHtmlHttp(
    http,
    portalHtml
  ).catch(() => null);

  onProgress("Atualizando…", 78);
  const turmaHtmls = await scrapeTurmaVirtualHtmls(http, portalHtml).catch(
    () => [] as string[]
  );

  onProgress("Salvando…", 90);
  await requestJson<{ ok: true }>("/api/sync/ingest-html", {
    method: "POST",
    body: JSON.stringify({
      portalHtml,
      refeicoesDisponiveis:
        refeicoesDisponiveis != null ? refeicoesDisponiveis : undefined,
      calendarioHtml: calendarioHtml || undefined,
      turmaHtmls: turmaHtmls.length > 0 ? turmaHtmls : undefined,
    }),
  });

  onProgress("Sincronização concluída.", 100);
}

export { DeviceSyncError };
