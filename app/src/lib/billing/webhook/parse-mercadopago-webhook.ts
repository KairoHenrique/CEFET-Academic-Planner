export interface MercadoPagoWebhookNotification {
  gatewayPaymentId: string;
  notificationType: string | null;
  action: string | null;
}

function readGatewayPaymentIdFromQuery(url: URL): string | null {
  const topic = url.searchParams.get("topic")?.trim().toLowerCase();
  const id = url.searchParams.get("id")?.trim();

  if (topic === "payment" && id) {
    return id;
  }

  const type = url.searchParams.get("type")?.trim().toLowerCase();
  if (type === "payment" && id) {
    return id;
  }

  return null;
}

function readGatewayPaymentIdFromBody(body: unknown): {
  gatewayPaymentId: string | null;
  notificationType: string | null;
  action: string | null;
} {
  if (!body || typeof body !== "object") {
    return { gatewayPaymentId: null, notificationType: null, action: null };
  }

  const record = body as Record<string, unknown>;
  const notificationType =
    typeof record.type === "string" ? record.type.trim() : null;
  const action = typeof record.action === "string" ? record.action.trim() : null;

  const data = record.data;
  if (!data || typeof data !== "object") {
    return { gatewayPaymentId: null, notificationType, action };
  }

  const dataId = (data as Record<string, unknown>).id;
  if (dataId == null) {
    return { gatewayPaymentId: null, notificationType, action };
  }

  return {
    gatewayPaymentId: String(dataId).trim() || null,
    notificationType,
    action,
  };
}

export function parseMercadoPagoWebhookNotification(
  url: URL,
  body: unknown
): MercadoPagoWebhookNotification | null {
  const fromQuery = readGatewayPaymentIdFromQuery(url);
  if (fromQuery) {
    return {
      gatewayPaymentId: fromQuery,
      notificationType: url.searchParams.get("topic"),
      action: null,
    };
  }

  const fromBody = readGatewayPaymentIdFromBody(body);
  if (fromBody.gatewayPaymentId) {
    return {
      gatewayPaymentId: fromBody.gatewayPaymentId,
      notificationType: fromBody.notificationType,
      action: fromBody.action,
    };
  }

  return null;
}
