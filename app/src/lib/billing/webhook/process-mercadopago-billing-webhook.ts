import { internalError, unauthorizedError } from "@/lib/api/errors";
import { confirmBillingPayment } from "./confirm-billing-payment";
import { fetchMercadoPagoPaymentDetails } from "./fetch-mercadopago-payment";
import { parseMercadoPagoWebhookNotification } from "./parse-mercadopago-webhook";
import {
  shouldSkipMercadoPagoWebhookVerification,
  verifyMercadoPagoWebhookSignature,
} from "./verify-mercadopago-webhook-signature";
import { ensurePostgresReady } from "@/lib/db/bootstrap-postgres";

function readMercadoPagoAccessToken(): string {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN?.trim();
  if (!token) {
    throw internalError("Mercado Pago não configurado para webhook.");
  }
  return token;
}

function readMercadoPagoWebhookSecret(): string {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET?.trim();
  if (!secret) {
    throw unauthorizedError("MERCADOPAGO_WEBHOOK_SECRET ausente.");
  }
  return secret;
}

async function readWebhookBody(request: Request): Promise<unknown> {
  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";

  if (!contentType.includes("application/json")) {
    return null;
  }

  try {
    return await request.json();
  } catch {
    return null;
  }
}

export async function processMercadoPagoBillingWebhook(
  request: Request
): Promise<{
  ok: true;
  processed: boolean;
  gatewayPaymentId: string;
}> {
  await ensurePostgresReady();

  const url = new URL(request.url);
  const body = await readWebhookBody(request);
  const notification = parseMercadoPagoWebhookNotification(url, body);

  if (!notification?.gatewayPaymentId) {
    throw internalError("Notificação Mercado Pago sem ID de pagamento.");
  }

  if (!shouldSkipMercadoPagoWebhookVerification()) {
    verifyMercadoPagoWebhookSignature({
      request,
      dataId: notification.gatewayPaymentId,
      secret: readMercadoPagoWebhookSecret(),
    });
  }

  const details = await fetchMercadoPagoPaymentDetails(
    notification.gatewayPaymentId,
    readMercadoPagoAccessToken()
  );

  // Pagamento inexistente (ex.: "Simular notificação" com ID fictício):
  // reconhece o recebimento (200) sem processar, evitando retries do MP.
  if (!details) {
    return {
      ok: true,
      processed: false,
      gatewayPaymentId: notification.gatewayPaymentId,
    };
  }

  const result = await confirmBillingPayment({
    gateway: "mercadopago",
    gatewayPaymentId: details.id,
    externalReference: details.externalReference,
    mappedStatus: details.mappedStatus,
  });

  return {
    ok: true,
    processed: result.processed,
    gatewayPaymentId: details.id,
  };
}
