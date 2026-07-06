import { validationError } from "@/lib/api/errors";
import { confirmBillingPayment } from "./confirm-billing-payment";
import type { PaymentStatus } from "@/lib/billing/schema/billing-schema-catalog";
import { isPaymentStatus } from "@/lib/billing/schema/billing-schema-catalog";
import { ensurePostgresReady } from "@/lib/db/bootstrap-postgres";

const MOCK_WEBHOOK_HEADER = "x-planner-webhook-secret";

function readMockWebhookSecret(): string | null {
  return process.env.PLANNER_PIX_MOCK_WEBHOOK_SECRET?.trim() || null;
}

function assertMockWebhookAuthorized(request: Request): void {
  const secret = readMockWebhookSecret();
  if (!secret) {
    throw validationError(
      "Mock webhook desabilitado (PLANNER_PIX_MOCK_WEBHOOK_SECRET ausente)."
    );
  }

  const provided =
    request.headers.get(MOCK_WEBHOOK_HEADER)?.trim() ??
    request.headers.get("X-Planner-Webhook-Secret")?.trim();

  if (provided !== secret) {
    throw validationError("Secret do mock webhook inválido.");
  }
}

function parseMockWebhookBody(body: unknown): {
  paymentId: string;
  status: PaymentStatus;
} {
  if (!body || typeof body !== "object") {
    throw validationError("Corpo JSON inválido.");
  }

  const record = body as Record<string, unknown>;
  const paymentId =
    typeof record.paymentId === "string" ? record.paymentId.trim() : "";

  if (!paymentId) {
    throw validationError("Campo paymentId é obrigatório.");
  }

  const statusRaw =
    typeof record.status === "string" ? record.status.trim() : "approved";

  if (!isPaymentStatus(statusRaw)) {
    throw validationError("Status de pagamento inválido.");
  }

  return { paymentId, status: statusRaw };
}

export async function processMockBillingWebhook(
  request: Request
): Promise<{
  ok: true;
  processed: boolean;
  paymentId: string;
}> {
  assertMockWebhookAuthorized(request);
  await ensurePostgresReady();

  const body = await request.json();
  const parsed = parseMockWebhookBody(body);

  const result = await confirmBillingPayment({
    gateway: "mock",
    externalReference: `planner-pay-${parsed.paymentId}`,
    mappedStatus: parsed.status,
  });

  return {
    ok: true,
    processed: result.processed,
    paymentId: parsed.paymentId,
  };
}
