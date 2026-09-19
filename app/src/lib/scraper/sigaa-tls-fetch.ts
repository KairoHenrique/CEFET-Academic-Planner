/**
 * HTTPS para sig.cefetmg.br via `node:tls` com CA bundle próprio.
 * Contorna cadeia incompleta (leaf só) que quebra o `fetch` do Workers (526).
 */

import { connect as tlsConnect, type TLSSocket } from "node:tls";
import { SIGAA_TRUSTED_CA_PEM } from "@/lib/scraper/sigaa-trusted-ca";

export interface SigaaTlsFetchInit {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
}

export interface SigaaTlsFetchResult {
  status: number;
  statusText: string;
  headers: Headers;
  body: string;
  url: string;
}

const DEFAULT_TIMEOUT_MS = 25_000;

class SocketByteReader {
  private pending = Buffer.alloc(0);
  private ended = false;
  private waiters: Array<{
    resolve: () => void;
    reject: (error: Error) => void;
  }> = [];

  constructor(private readonly socket: TLSSocket) {
    socket.on("data", (chunk: Buffer) => {
      this.pending = Buffer.concat([this.pending, chunk]);
      this.flushWaiters();
    });
    socket.on("end", () => {
      this.ended = true;
      this.flushWaiters();
    });
    socket.on("error", (error: Error) => {
      for (const waiter of this.waiters.splice(0)) {
        waiter.reject(error);
      }
    });
  }

  private flushWaiters(): void {
    for (const waiter of this.waiters.splice(0)) {
      waiter.resolve();
    }
  }

  private waitForData(): Promise<void> {
    if (this.pending.length > 0 || this.ended) {
      return Promise.resolve();
    }
    return new Promise((resolve, reject) => {
      this.waiters.push({ resolve, reject });
    });
  }

  async readUntil(predicate: (buf: Buffer) => number): Promise<Buffer> {
    for (;;) {
      const cut = predicate(this.pending);
      if (cut >= 0) {
        const head = this.pending.subarray(0, cut);
        this.pending = this.pending.subarray(cut);
        return head;
      }
      if (this.ended) {
        const all = this.pending;
        this.pending = Buffer.alloc(0);
        return all;
      }
      await this.waitForData();
    }
  }

  async readExact(length: number): Promise<Buffer> {
    return this.readUntil((buf) => (buf.length >= length ? length : -1));
  }

  async readToEnd(): Promise<Buffer> {
    while (!this.ended) {
      await this.waitForData();
    }
    const all = this.pending;
    this.pending = Buffer.alloc(0);
    return all;
  }
}

function parseStatusLine(line: string): { status: number; statusText: string } {
  const match = /^HTTP\/\d(?:\.\d)?\s+(\d{3})(?:\s+(.*))?$/i.exec(line.trim());
  if (!match) {
    throw new Error(`Resposta HTTP inválida do SIGAA: ${line.slice(0, 80)}`);
  }
  return {
    status: Number(match[1]),
    statusText: (match[2] ?? "").trim(),
  };
}

function decodeChunkedBody(raw: Buffer): Buffer {
  const out: Buffer[] = [];
  let offset = 0;
  while (offset < raw.length) {
    const lineEnd = raw.indexOf("\r\n", offset);
    if (lineEnd < 0) break;
    const sizeLine = raw.subarray(offset, lineEnd).toString("utf8");
    const size = Number.parseInt(sizeLine.split(";")[0] ?? "", 16);
    if (!Number.isFinite(size) || size < 0) {
      throw new Error("Chunked encoding inválido na resposta SIGAA.");
    }
    offset = lineEnd + 2;
    if (size === 0) break;
    out.push(raw.subarray(offset, offset + size));
    offset += size + 2;
  }
  return Buffer.concat(out);
}

async function readHttpResponse(
  reader: SocketByteReader
): Promise<{ status: number; statusText: string; headers: Headers; body: string }> {
  const headerBuf = await reader.readUntil((buf) => {
    const idx = buf.indexOf("\r\n\r\n");
    return idx >= 0 ? idx + 4 : -1;
  });

  const headerText = headerBuf.toString("utf8");
  const sep = headerText.indexOf("\r\n\r\n");
  const headPart = sep >= 0 ? headerText.slice(0, sep) : headerText;
  const lines = headPart.split("\r\n");
  const { status, statusText } = parseStatusLine(lines[0] ?? "");
  const headers = new Headers();
  for (const line of lines.slice(1)) {
    const colon = line.indexOf(":");
    if (colon <= 0) continue;
    const name = line.slice(0, colon).trim();
    const value = line.slice(colon + 1).trim();
    if (name.toLowerCase() === "set-cookie") {
      headers.append("set-cookie", value);
    } else {
      headers.set(name, value);
    }
  }

  const transferEncoding = (headers.get("transfer-encoding") ?? "").toLowerCase();
  const contentLengthRaw = headers.get("content-length");
  let bodyBuf = Buffer.alloc(0);

  if (transferEncoding.includes("chunked")) {
    const chunked = await reader.readUntil((buf) => {
      const marker = Buffer.from("\r\n0\r\n\r\n");
      const at = buf.indexOf(marker);
      if (at >= 0) return at + marker.length;
      if (buf.indexOf(Buffer.from("0\r\n\r\n")) === 0) return 5;
      return -1;
    });
    bodyBuf = decodeChunkedBody(chunked);
  } else if (contentLengthRaw != null && contentLengthRaw !== "") {
    const length = Number(contentLengthRaw);
    if (!Number.isFinite(length) || length < 0) {
      throw new Error("Content-Length inválido na resposta SIGAA.");
    }
    bodyBuf = length === 0 ? Buffer.alloc(0) : await reader.readExact(length);
  } else {
    bodyBuf = await reader.readToEnd();
  }

  return {
    status,
    statusText,
    headers,
    body: bodyBuf.toString("utf8"),
  };
}

function openSigaaTlsSocket(hostname: string, timeoutMs: number): Promise<TLSSocket> {
  return new Promise((resolve, reject) => {
    const socket = tlsConnect(
      {
        host: hostname,
        port: 443,
        servername: hostname,
        ca: SIGAA_TRUSTED_CA_PEM,
        rejectUnauthorized: true,
      },
      () => resolve(socket)
    );
    socket.setTimeout(timeoutMs, () => {
      socket.destroy(new Error("Timeout TLS/HTTP no SIGAA."));
    });
    socket.once("error", reject);
  });
}

/**
 * GET/POST HTTPS para hosts SIGAA com verificação TLS confiável no Workers.
 */
export async function fetchSigaaViaTrustedTls(
  urlRaw: string,
  init: SigaaTlsFetchInit = {},
  timeoutMs = DEFAULT_TIMEOUT_MS
): Promise<SigaaTlsFetchResult> {
  const url = new URL(urlRaw);
  if (url.protocol !== "https:" || url.hostname !== "sig.cefetmg.br") {
    throw new Error("fetchSigaaViaTrustedTls só permite https://sig.cefetmg.br");
  }

  const method = (init.method ?? "GET").toUpperCase();
  const body = init.body ?? "";
  const headers: Record<string, string> = {
    Host: url.host,
    Connection: "close",
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "pt-BR,pt;q=0.9",
    ...init.headers,
  };
  if (method === "POST" || method === "PUT" || method === "PATCH") {
    headers["Content-Length"] = String(Buffer.byteLength(body, "utf8"));
  }

  const path = `${url.pathname}${url.search}`;
  const headerLines = Object.entries(headers)
    .map(([k, v]) => `${k}: ${v}`)
    .join("\r\n");
  const requestText = `${method} ${path} HTTP/1.1\r\n${headerLines}\r\n\r\n${
    method === "GET" || method === "HEAD" ? "" : body
  }`;

  const socket = await openSigaaTlsSocket(url.hostname, timeoutMs);
  try {
    const reader = new SocketByteReader(socket);
    socket.write(requestText);
    const response = await readHttpResponse(reader);
    return {
      ...response,
      url: url.toString(),
    };
  } finally {
    socket.destroy();
  }
}
