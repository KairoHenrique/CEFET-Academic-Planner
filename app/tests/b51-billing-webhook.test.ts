import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it } from "node:test";
import { mapMercadoPagoPaymentStatus } from "../src/lib/billing/webhook/map-mercadopago-payment-status";
import { parseMercadoPagoWebhookNotification } from "../src/lib/billing/webhook/parse-mercadopago-webhook";
import { verifyMercadoPagoWebhookSignature } from "../src/lib/billing/webhook/verify-mercadopago-webhook-signature";

describe("B51 — mapMercadoPagoPaymentStatus", () => {
  it("mapeia approved para approved", () => {
    assert.equal(mapMercadoPagoPaymentStatus("approved"), "approved");
  });

  it("mapeia pending para null (ignorar)", () => {
    assert.equal(mapMercadoPagoPaymentStatus("pending"), null);
  });

  it("mapeia rejected/cancelled", () => {
    assert.equal(mapMercadoPagoPaymentStatus("rejected"), "rejected");
    assert.equal(mapMercadoPagoPaymentStatus("cancelled"), "cancelled");
  });
});

describe("B51 — parseMercadoPagoWebhookNotification", () => {
  it("lê query topic=payment&id=", () => {
    const url = new URL(
      "https://example.com/api/billing/webhook/mercadopago?topic=payment&id=12345"
    );
    const parsed = parseMercadoPagoWebhookNotification(url, null);
    assert.deepEqual(parsed, {
      gatewayPaymentId: "12345",
      notificationType: "payment",
      action: null,
    });
  });

  it("lê body JSON type payment", () => {
    const url = new URL("https://example.com/api/billing/webhook/mercadopago");
    const parsed = parseMercadoPagoWebhookNotification(url, {
      type: "payment",
      action: "payment.updated",
      data: { id: "998877" },
    });
    assert.equal(parsed?.gatewayPaymentId, "998877");
    assert.equal(parsed?.action, "payment.updated");
  });
});

describe("B51 — verifyMercadoPagoWebhookSignature", () => {
  it("aceita assinatura HMAC válida", () => {
    const secret = "test-webhook-secret";
    const dataId = "12345";
    const requestId = "req-abc";
    const ts = "1700000000";
    const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
    const v1 = createHmac("sha256", secret).update(manifest).digest("hex");

    const request = new Request("https://example.com/webhook", {
      headers: {
        "x-signature": `ts=${ts},v1=${v1}`,
        "x-request-id": requestId,
      },
    });

    assert.doesNotThrow(() =>
      verifyMercadoPagoWebhookSignature({ request, dataId, secret })
    );
  });
});

describe("B51 — API webhook routes", () => {
  it("Mercado Pago exporta POST e GET", () => {
    const source = readFileSync(
      resolve(
        __dirname,
        "../src/app/api/billing/webhook/mercadopago/route.ts"
      ),
      "utf8"
    );
    assert.match(source, /processMercadoPagoBillingWebhook/);
    assert.match(source, /export const GET = POST/);
  });

  it("Mock webhook exporta POST", () => {
    const source = readFileSync(
      resolve(__dirname, "../src/app/api/billing/webhook/mock/route.ts"),
      "utf8"
    );
    assert.match(source, /processMockBillingWebhook/);
  });
});

describe("B51 — confirm billing payment module", () => {
  it("exporta confirmBillingPayment", async () => {
    const mod = await import(
      "../src/lib/billing/webhook/confirm-billing-payment.ts"
    );
    assert.equal(typeof mod.confirmBillingPayment, "function");
  });
});
