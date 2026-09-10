/**
 * Cliente HTTP com jar de cookies — login/scrape SIGAA no aparelho (sem CF).
 * Usa fetch nativo + credentials include (cookie store do OS) e jar manual.
 */

export type DeviceFetch = (
  input: string,
  init?: RequestInit
) => Promise<Response>;

function parseSetCookieHeaders(response: Response): string[] {
  const headers = response.headers as Headers & {
    getSetCookie?: () => string[];
  };
  if (typeof headers.getSetCookie === "function") {
    return headers.getSetCookie();
  }
  const single = response.headers.get("set-cookie");
  return single ? [single] : [];
}

function cookiePair(setCookie: string): string | null {
  const pair = setCookie.split(";")[0]?.trim();
  return pair && pair.includes("=") ? pair : null;
}

export class DeviceHttpSession {
  private readonly cookies = new Map<string, string>();
  private readonly userAgent =
    "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36 ACMEHub/1.0";

  getCookieHeader(): string {
    return Array.from(this.cookies.entries())
      .map(([name, value]) => `${name}=${value}`)
      .join("; ");
  }

  ingestSetCookie(response: Response): void {
    for (const raw of parseSetCookieHeaders(response)) {
      const pair = cookiePair(raw);
      if (!pair) continue;
      const eq = pair.indexOf("=");
      const name = pair.slice(0, eq);
      const value = pair.slice(eq + 1);
      if (name) this.cookies.set(name, value);
    }
  }

  async request(
    url: string,
    init: RequestInit = {}
  ): Promise<{ response: Response; text: string; url: string }> {
    const headers = new Headers(init.headers);
    if (!headers.has("User-Agent")) {
      headers.set("User-Agent", this.userAgent);
    }
    const cookieHeader = this.getCookieHeader();
    if (cookieHeader) {
      headers.set("Cookie", cookieHeader);
    }

    const response = await fetch(url, {
      ...init,
      headers,
      credentials: "include",
    });
    this.ingestSetCookie(response);
    const text = await response.text();
    return {
      response,
      text,
      url: response.url || url,
    };
  }
}
