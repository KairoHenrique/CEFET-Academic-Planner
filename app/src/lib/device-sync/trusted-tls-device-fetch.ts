import type { DeviceFetch } from "@/lib/device-sync/http-session";
import { fetchSigaaViaTrustedTls } from "@/lib/scraper/sigaa-tls-fetch";

/**
 * DeviceFetch para o edge: HTTP sobre `node:tls` + CA RNP (evita 526 do fetch Workers).
 */
export function createTrustedTlsDeviceFetch(): DeviceFetch {
  return async (input, init = {}) => {
    const headers: Record<string, string> = {};
    new Headers(init.headers).forEach((value, key) => {
      headers[key] = value;
    });

    const body =
      typeof init.body === "string"
        ? init.body
        : init.body != null
          ? String(init.body)
          : undefined;

    const upstream = await fetchSigaaViaTrustedTls(String(input), {
      method: (init.method ?? "GET").toUpperCase(),
      headers,
      body,
    });

    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: upstream.headers,
    });
  };
}
