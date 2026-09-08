import type { DeviceFetch } from "@/lib/device-sync/http-session";
import { getSession } from "@/lib/auth/session";

interface RelayResponse {
  ok: true;
  status: number;
  url: string;
  location: string | null;
  setCookie: string[];
  body: string;
}

/**
 * Fetch via `POST /api/sync/sigaa-relay` — contorna CORS no browser.
 * Mantém jar de cookies no closure do DeviceHttpSession (header Cookie).
 */
export function createWebSigaaRelayFetch(): DeviceFetch {
  return async (input, init = {}) => {
    const session = getSession();
    if (!session?.accessToken) {
      throw new Error("Sessão do app necessária para o relay SIGAA.");
    }

    const headers = new Headers(init.headers);
    const cookie = headers.get("Cookie") ?? "";
    const contentType = headers.get("Content-Type") ?? undefined;
    const referer = headers.get("Referer") ?? undefined;
    const method = (init.method ?? "GET").toUpperCase();
    const body =
      typeof init.body === "string"
        ? init.body
        : init.body != null
          ? String(init.body)
          : undefined;

    const response = await fetch("/api/sync/sigaa-relay", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.accessToken}`,
      },
      body: JSON.stringify({
        url: input,
        method,
        cookie: cookie || undefined,
        contentType,
        referer,
        body,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || `Relay SIGAA falhou (${response.status}).`);
    }

    const data = (await response.json()) as RelayResponse;
    const outHeaders = new Headers();
    for (const raw of data.setCookie ?? []) {
      outHeaders.append("set-cookie", raw);
    }
    if (data.location) {
      outHeaders.set("location", data.location);
    }

    return new Response(data.body, {
      status: data.status,
      headers: outHeaders,
    });
  };
}
