import { SIGAA_PORTAL_DISCENTE_URL } from "./constants";
import { DeviceSyncError } from "./login-sigaa-http";
import type { DeviceHttpSession } from "./http-session";

export async function fetchPortalDiscenteHtml(
  session: DeviceHttpSession
): Promise<string> {
  const page = await session.request(SIGAA_PORTAL_DISCENTE_URL, {
    method: "GET",
  });

  if (!page.response.ok) {
    throw new DeviceSyncError(
      "SIGAA_SCRAPE_FAILED",
      "Não foi possível ler o portal do discente. Tente novamente."
    );
  }

  if (
    /verTelaLogin\.do/i.test(page.url) ||
    /name=["']password["']/i.test(page.text)
  ) {
    throw new DeviceSyncError(
      "INVALID_CREDENTIALS",
      "Sessão do SIGAA expirada. Faça login novamente."
    );
  }

  return page.text;
}
