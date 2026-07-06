import { createHmac, timingSafeEqual } from "node:crypto";
import { unauthorizedError } from "@/lib/api/errors";

function readSignatureHeader(request: Request): string | null {
  const raw =
    request.headers.get("x-signature") ??
    request.headers.get("X-Signature");
  return raw?.trim() || null;
}

function parseSignatureParts(header: string): {
  ts: string | null;
  v1: string | null;
} {
  const parts = header.split(",");
  let ts: string | null = null;
  let v1: string | null = null;

  for (const part of parts) {
    const [key, value] = part.split("=").map((segment) => segment.trim());
    if (key === "ts") {
      ts = value ?? null;
    }
    if (key === "v1") {
      v1 = value ?? null;
    }
  }

  return { ts, v1 };
}

function buildMercadoPagoSignatureManifest(input: {
  dataId: string;
  requestId: string;
  ts: string;
}): string {
  return `id:${input.dataId};request-id:${input.requestId};ts:${input.ts};`;
}

function safeCompareHex(expected: string, received: string): boolean {
  try {
    const expectedBuffer = Buffer.from(expected, "hex");
    const receivedBuffer = Buffer.from(received, "hex");
    if (expectedBuffer.length !== receivedBuffer.length) {
      return false;
    }
    return timingSafeEqual(expectedBuffer, receivedBuffer);
  } catch {
    return false;
  }
}

export function verifyMercadoPagoWebhookSignature(input: {
  request: Request;
  dataId: string;
  secret: string;
}): void {
  const signatureHeader = readSignatureHeader(input.request);
  if (!signatureHeader) {
    throw unauthorizedError("Assinatura do webhook Mercado Pago ausente.");
  }

  const requestId =
    input.request.headers.get("x-request-id")?.trim() ??
    input.request.headers.get("X-Request-Id")?.trim();

  if (!requestId) {
    throw unauthorizedError("x-request-id do webhook Mercado Pago ausente.");
  }

  const { ts, v1 } = parseSignatureParts(signatureHeader);
  if (!ts || !v1) {
    throw unauthorizedError("Assinatura do webhook Mercado Pago inválida.");
  }

  const manifest = buildMercadoPagoSignatureManifest({
    dataId: input.dataId,
    requestId,
    ts,
  });

  const expected = createHmac("sha256", input.secret)
    .update(manifest)
    .digest("hex");

  if (!safeCompareHex(expected, v1)) {
    throw unauthorizedError("Assinatura do webhook Mercado Pago rejeitada.");
  }
}

export function shouldSkipMercadoPagoWebhookVerification(
  env: NodeJS.ProcessEnv = process.env
): boolean {
  return env.MERCADOPAGO_WEBHOOK_SKIP_VERIFY?.trim().toLowerCase() === "true";
}
