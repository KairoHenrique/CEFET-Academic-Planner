/**
 * Cliente HTTP com jar de cookies — login/scrape SIGAA sem Playwright.
 * Usado no sync no aparelho (web via relay · mobile via fetch nativo).
 */

export type DeviceFetch = (
  input: string,
  init?: RequestInit
) => Promise<Response>;

export interface DeviceHttpSessionOptions {
  fetchImpl?: DeviceFetch;
  userAgent?: string;
}

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
  private readonly fetchImpl: DeviceFetch;
  private readonly userAgent: string;

  constructor(options: DeviceHttpSessionOptions = {}) {
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.userAgent =
      options.userAgent ??
      "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36 ACMEHubDeviceSync/1.0";
  }

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
  ): Promise<{ response: Response; text: string }> {
    const headers = new Headers(init.headers);
    if (!headers.has("User-Agent")) {
      headers.set("User-Agent", this.userAgent);
    }
    const cookieHeader = this.getCookieHeader();
    if (cookieHeader) {
      headers.set("Cookie", cookieHeader);
    }

    const response = await this.fetchImpl(url, { ...init, headers });
    this.ingestSetCookie(response);
    const text = await response.text();
    return { response, text };
  }
}
