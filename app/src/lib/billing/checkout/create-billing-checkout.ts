import { randomUUID } from "node:crypto";
import {
  authUnavailableError,
  internalError,
  validationError,
} from "@/lib/api/errors";
import { buildPaymentExternalReference } from "./build-payment-external-reference";
import {
  findPaymentById,
  findPaymentByIdempotencyKey,
  insertPendingPayment,
  markPaymentRejected,
  updatePaymentAfterPixCharge,
} from "./billing-payment-repository";
import {
  findSubscriptionById,
  insertPendingPixSubscription,
} from "./billing-subscription-repository";
import type {
  BillingCheckoutInput,
  BillingCheckoutPaymentView,
  BillingCheckoutResponse,
  BillingCheckoutSubscriptionView,
} from "./types";
import { createPixCharge } from "@/lib/billing/gateway/create-pix-charge";
import {
  resolvePixGatewayConfig,
  resolvePixGatewayId,
} from "@/lib/billing/gateway/resolve-pix-gateway-config";
import {
  getBillingPlanDefinition,
  resolvePlanDurationDays,
  resolvePlanLabel,
} from "@/lib/billing/plan-catalog";
import { resolveBillingPriceCents } from "@/lib/billing/resolve-plan-prices";
import { isCheckoutRenewalForUser } from "@/lib/billing/access/resolve-subscription-access";
import type { PaymentRow } from "@/lib/billing/schema/billing-row-types";
import type { SubscriptionRow } from "@/lib/billing/schema/billing-row-types";

function assertCheckoutGatewayReady(): void {
  const config = resolvePixGatewayConfig();
  if (!config.checkoutReady) {
    throw authUnavailableError(
      "Checkout PIX indisponível. Configure o gateway ou PLANNER_PIX_MOCK_CHECKOUT=true."
    );
  }
}

function isPaymentStillPending(payment: PaymentRow): boolean {
  if (payment.status !== "pending") {
    return false;
  }

  if (!payment.expires_at) {
    return true;
  }

  return Date.parse(payment.expires_at) > Date.now();
}

function readQrCodeBase64(payment: PaymentRow): string | null {
  const value = payment.metadata?.qrCodeBase64;
  return typeof value === "string" ? value : null;
}

function readTicketUrl(payment: PaymentRow): string | null {
  const value = payment.metadata?.ticketUrl;
  return typeof value === "string" ? value : null;
}

function mapPaymentView(payment: PaymentRow): BillingCheckoutPaymentView {
  if (!payment.qr_code || !payment.expires_at) {
    throw internalError("Pagamento PIX incompleto.");
  }

  return {
    id: payment.id,
    planId: payment.plan_id,
    amountCents: payment.amount_cents,
    currency: "BRL",
    status: payment.status,
    gateway: payment.gateway,
    externalReference: payment.external_reference,
    idempotencyKey: payment.idempotency_key,
    expiresAt: payment.expires_at,
    qrCode: payment.qr_code,
    qrCodeBase64: readQrCodeBase64(payment),
    ticketUrl: readTicketUrl(payment),
  };
}

async function mapSubscriptionView(
  subscriptionId: string
): Promise<BillingCheckoutSubscriptionView> {
  const subscription = await findSubscriptionById(subscriptionId);
  if (!subscription) {
    throw internalError("Assinatura não encontrada.");
  }

  return {
    id: subscription.id,
    planId: subscription.plan_id,
    status: subscription.status,
    expiresAt: subscription.expires_at,
  };
}

async function buildResponseFromPayment(
  payment: PaymentRow,
  reused: boolean,
  renewal: boolean
): Promise<BillingCheckoutResponse> {
  if (!payment.subscription_id) {
    throw internalError("Pagamento sem assinatura vinculada.");
  }

  return {
    ok: true,
    reused,
    renewal,
    payment: mapPaymentView(payment),
    subscription: await mapSubscriptionView(payment.subscription_id),
  };
}

async function resolveIdempotentPayment(
  userId: string,
  cpf: string,
  idempotencyKey: string
): Promise<BillingCheckoutResponse | null> {
  const existing = await findPaymentByIdempotencyKey(userId, idempotencyKey);
  if (!existing) {
    return null;
  }

  const renewal = await isCheckoutRenewalForUser(cpf);

  if (isPaymentStillPending(existing) && existing.qr_code) {
    return buildResponseFromPayment(existing, true, renewal);
  }

  if (existing.status === "approved") {
    throw validationError("Pagamento já confirmado para esta chave de idempotência.");
  }

  throw validationError(
    "Chave de idempotência já utilizada. Gere uma nova para tentar novamente."
  );
}

async function createNewPixCheckout(
  input: BillingCheckoutInput
): Promise<BillingCheckoutResponse> {
  const plan = getBillingPlanDefinition(input.planId);
  if (!plan?.purchasable || plan.kind !== "paid") {
    throw validationError("Plano não disponível para compra.", {
      planId: input.planId,
    });
  }

  const renewal = await isCheckoutRenewalForUser(input.cpf);
  const amountCents = resolveBillingPriceCents(input.planId);
  const durationDays = resolvePlanDurationDays(input.planId);
  const gatewayId = resolvePixGatewayId();
  const paymentId = randomUUID();
  const externalReference = buildPaymentExternalReference(paymentId);

  const subscription = await insertPendingPixSubscription({
    userId: input.userId,
    planId: input.planId,
    durationDays,
  });

  let payment: PaymentRow;

  try {
    payment = await insertPendingPayment({
      id: paymentId,
      userId: input.userId,
      subscriptionId: subscription.id,
      planId: input.planId,
      amountCents,
      gateway: gatewayId,
      externalReference,
      idempotencyKey: input.idempotencyKey,
      payerCpf: input.cpf,
    });
  } catch (error) {
    const pgCode =
      error && typeof error === "object" && "code" in error
        ? String((error as { code: string }).code)
        : "";

    if (pgCode === "23505") {
      const existing = await findPaymentByIdempotencyKey(
        input.userId,
        input.idempotencyKey
      );
      if (existing) {
        return buildResponseFromPayment(existing, true, renewal);
      }
    }

    throw error;
  }

  try {
    const charge = await createPixCharge({
      planId: input.planId,
      amountCents,
      description: `${resolvePlanLabel(input.planId)} — ACME HUB`,
      externalReference,
      payerEmail: input.email,
      payerCpf: input.cpf,
    });

    payment = await updatePaymentAfterPixCharge({
      paymentId: payment.id,
      gatewayPaymentId: charge.gatewayPaymentId,
      qrCode: charge.qrCode,
      expiresAt: charge.expiresAt,
      metadata: {
        qrCodeBase64: charge.qrCodeBase64,
        ticketUrl: charge.ticketUrl,
      },
    });
  } catch (error) {
    await markPaymentRejected(payment.id).catch(() => undefined);
    throw internalError("Não foi possível gerar cobrança PIX. Tente novamente.");
  }

  const refreshed = await findPaymentById(payment.id);
  if (!refreshed) {
    throw internalError("Pagamento não encontrado após checkout.");
  }

  return buildResponseFromPayment(refreshed, false, renewal);
}

export async function createBillingCheckout(
  input: BillingCheckoutInput
): Promise<BillingCheckoutResponse> {
  assertCheckoutGatewayReady();

  const idempotent = await resolveIdempotentPayment(
    input.userId,
    input.cpf,
    input.idempotencyKey
  );
  if (idempotent) {
    return idempotent;
  }

  return createNewPixCheckout(input);
}

export function resolveCheckoutIdempotencyKey(
  headerKey: string | null,
  bodyKey: string | null
): string {
  const resolved = headerKey ?? bodyKey ?? randomUUID();
  if (headerKey && bodyKey && headerKey !== bodyKey) {
    throw validationError(
      "Idempotency-Key do header difere do corpo da requisição."
    );
  }
  return resolved;
}
