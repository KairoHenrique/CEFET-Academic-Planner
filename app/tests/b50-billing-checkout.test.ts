import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, beforeEach, afterEach } from "node:test";
import { ApiError } from "../src/lib/api/errors";
import { shouldEnforceAccessGate } from "../src/lib/auth/access/access-gate";
import { buildBillingPlansResponse } from "../src/lib/billing/build-plans-response";
import { buildPaymentExternalReference } from "../src/lib/billing/checkout/build-payment-external-reference";
import { resolveCheckoutIdempotencyKey } from "../src/lib/billing/checkout/create-billing-checkout";
import {
  parseBillingCheckoutRequest,
  readIdempotencyKeyFromHeaders,
} from "../src/lib/billing/checkout/parse-billing-checkout-request";

const ENV_BACKUP = { ...process.env };

function clearPixGatewayEnv(): void {
  delete process.env.PIX_GATEWAY;
  delete process.env.MERCADOPAGO_ACCESS_TOKEN;
  delete process.env.PLANNER_PIX_MOCK_CHECKOUT;
}

describe("B50 — parseBillingCheckoutRequest", () => {
  it("aceita planId paid válido", () => {
    const parsed = parseBillingCheckoutRequest({ planId: "semester" });
    assert.equal(parsed.planId, "semester");
    assert.equal(parsed.idempotencyKey, null);
  });

  it("rejeita planId trial ou inválido", () => {
    assert.throws(
      () => parseBillingCheckoutRequest({ planId: "trial" }),
      (error: unknown) =>
        error instanceof ApiError && error.code === "VALIDATION_ERROR"
    );
  });

  it("valida idempotencyKey", () => {
    assert.throws(
      () => parseBillingCheckoutRequest({ planId: "month", idempotencyKey: "abc" }),
      (error: unknown) =>
        error instanceof ApiError && error.message.includes("idempotencyKey")
    );
  });
});

describe("B50 — resolveCheckoutIdempotencyKey", () => {
  it("usa header quando body ausente", () => {
    const key = resolveCheckoutIdempotencyKey("header-key-12345678", null);
    assert.equal(key, "header-key-12345678");
  });

  it("rejeita header e body divergentes", () => {
    assert.throws(
      () =>
        resolveCheckoutIdempotencyKey("header-key-12345678", "body-key-12345678"),
      (error: unknown) =>
        error instanceof ApiError && error.code === "VALIDATION_ERROR"
    );
  });
});

describe("B50 — buildPaymentExternalReference", () => {
  it("prefixo estável planner-pay", () => {
    const ref = buildPaymentExternalReference(
      "550e8400-e29b-41d4-a716-446655440000"
    );
    assert.equal(ref, "planner-pay-550e8400-e29b-41d4-a716-446655440000");
  });
});

describe("B50 — access gate billing exempt", () => {
  it("checkout não passa pelo gate de assinatura", () => {
    const request = new Request("https://example.com/api/billing/checkout", {
      method: "POST",
    });
    assert.equal(shouldEnforceAccessGate(request), false);
  });

  it("disciplinas continua protegido", () => {
    const request = new Request("https://example.com/api/disciplinas", {
      method: "GET",
    });
    assert.equal(shouldEnforceAccessGate(request), true);
  });
});

describe("B50 — checkoutEnabled em planos", () => {
  beforeEach(() => {
    process.env = { ...ENV_BACKUP };
    clearPixGatewayEnv();
  });

  afterEach(() => {
    process.env = { ...ENV_BACKUP };
  });

  it("false sem mock checkout", () => {
    const response = buildBillingPlansResponse();
    assert.equal(response.checkoutEnabled, false);
  });

  it("true com PLANNER_PIX_MOCK_CHECKOUT", () => {
    process.env.PLANNER_PIX_MOCK_CHECKOUT = "true";
    const response = buildBillingPlansResponse();
    assert.equal(response.checkoutEnabled, true);
  });
});

describe("B50 — API POST /api/billing/checkout", () => {
  it("exporta handler POST", async () => {
    const routePath = resolve(
      __dirname,
      "../src/app/api/billing/checkout/route.ts"
    );
    const source = readFileSync(routePath, "utf8");
    assert.match(source, /export const POST/);
    assert.match(source, /createBillingCheckout/);
    assert.match(source, /resolveProfileFromAuthorization/);
  });
});

describe("B50 — Idempotency-Key header", () => {
  it("lê header Idempotency-Key", () => {
    const request = new Request("https://example.com/api/billing/checkout", {
      headers: { "Idempotency-Key": "client-key-12345678" },
    });
    assert.equal(
      readIdempotencyKeyFromHeaders(request),
      "client-key-12345678"
    );
  });
});
