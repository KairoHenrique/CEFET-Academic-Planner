import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, beforeEach, afterEach } from "node:test";
import { ApiError } from "../src/lib/api/errors";
import { buildPixGatewayStatusResponse } from "../src/lib/billing/gateway/build-gateway-status-response";
import { createPixCharge } from "../src/lib/billing/gateway/create-pix-charge";
import { getPixGateway } from "../src/lib/billing/gateway/get-pix-gateway";
import { mockPixGateway } from "../src/lib/billing/gateway/mock-pix-gateway";
import { parseMercadoPagoPixPaymentResponse } from "../src/lib/billing/gateway/mercadopago/parse-pix-payment-response";
import {
  resolvePixGatewayConfig,
  resolvePixGatewayId,
} from "../src/lib/billing/gateway/resolve-pix-gateway-config";

const ENV_BACKUP = { ...process.env };

function clearPixGatewayEnv(): void {
  delete process.env.PIX_GATEWAY;
  delete process.env.MERCADOPAGO_ACCESS_TOKEN;
  delete process.env.MERCADOPAGO_WEBHOOK_SECRET;
  delete process.env.ASAAS_API_KEY;
  delete process.env.ASAAS_ENV;
  delete process.env.PLANNER_PIX_MOCK_CHECKOUT;
}

describe("B48 — resolvePixGatewayConfig", () => {
  beforeEach(() => {
    process.env = { ...ENV_BACKUP };
    clearPixGatewayEnv();
  });

  afterEach(() => {
    process.env = { ...ENV_BACKUP };
  });

  it("default mock sem PIX_GATEWAY", () => {
    const config = resolvePixGatewayConfig();
    assert.equal(config.id, "mock");
    assert.equal(config.mode, "mock");
    assert.equal(config.configured, true);
    assert.equal(config.checkoutReady, false);
  });

  it("mock com PLANNER_PIX_MOCK_CHECKOUT=true fica checkoutReady", () => {
    process.env.PLANNER_PIX_MOCK_CHECKOUT = "true";
    const config = resolvePixGatewayConfig();
    assert.equal(config.checkoutReady, true);
  });

  it("mercadopago sem token fica não configurado", () => {
    process.env.PIX_GATEWAY = "mercadopago";
    const config = resolvePixGatewayConfig();
    assert.equal(config.id, "mercadopago");
    assert.equal(config.configured, false);
    assert.equal(config.checkoutReady, false);
  });

  it("mercadopago TEST token = sandbox checkoutReady", () => {
    process.env.PIX_GATEWAY = "mercadopago";
    process.env.MERCADOPAGO_ACCESS_TOKEN = "TEST-123456";
    const config = resolvePixGatewayConfig();
    assert.equal(config.mode, "sandbox");
    assert.equal(config.configured, true);
    assert.equal(config.checkoutReady, true);
  });

  it("mercadopago produção detecta token APP_USR", () => {
    process.env.PIX_GATEWAY = "mp";
    process.env.MERCADOPAGO_ACCESS_TOKEN = "APP_USR-abc";
    const config = resolvePixGatewayConfig();
    assert.equal(resolvePixGatewayId(), "mercadopago");
    assert.equal(config.mode, "production");
  });

  it("asaas configurado mas checkoutReady false (stub v1)", () => {
    process.env.PIX_GATEWAY = "asaas";
    process.env.ASAAS_API_KEY = "key_test";
    const config = resolvePixGatewayConfig();
    assert.equal(config.configured, true);
    assert.equal(config.checkoutReady, false);
  });
});

describe("B48 — mock gateway createPixCharge", () => {
  it("retorna QR determinístico por externalReference", async () => {
    const result = await mockPixGateway.createPixCharge({
      planId: "semester",
      amountCents: 8500,
      description: "Plano semestre",
      externalReference: "pay_test_001",
      payerEmail: "aluno@test.local",
      payerCpf: "12345678901",
    });

    assert.equal(result.gateway, "mock");
    assert.equal(result.status, "pending");
    assert.equal(result.gatewayPaymentId, "mock_pay_test_001");
    assert.match(result.qrCode, /MOCK-PIX-pay_test_001/);
    assert.ok(Date.parse(result.expiresAt));
  });

  it("createPixCharge usa factory mock por default", async () => {
    process.env = { ...ENV_BACKUP };
    clearPixGatewayEnv();

    const result = await createPixCharge({
      planId: "year",
      amountCents: 15000,
      description: "Plano anual",
      externalReference: "pay_factory_1",
    });

    assert.equal(result.gateway, "mock");
  });
});

describe("B48 — Mercado Pago parse resposta", () => {
  it("extrai qr_code e id do payload", () => {
    const parsed = parseMercadoPagoPixPaymentResponse({
      id: 12345,
      status: "pending",
      date_of_expiration: "2026-07-06T00:00:00.000-04:00",
      point_of_interaction: {
        transaction_data: {
          qr_code: "00020126580014BR.GOV.BCB.PIX",
          qr_code_base64: "base64data",
          ticket_url: "https://mercadopago.com/ticket",
        },
      },
    });

    assert.equal(parsed.gateway, "mercadopago");
    assert.equal(parsed.gatewayPaymentId, "12345");
    assert.equal(parsed.qrCode, "00020126580014BR.GOV.BCB.PIX");
    assert.equal(parsed.qrCodeBase64, "base64data");
  });

  it("falha sem qr_code", () => {
    assert.throws(
      () =>
        parseMercadoPagoPixPaymentResponse({
          id: 1,
          cause: [{ description: "invalid payer" }],
        }),
      (error: unknown) => {
        assert.ok(error instanceof ApiError);
        assert.equal(error.status, 502);
        return true;
      }
    );
  });
});

describe("B48 — getPixGateway erros", () => {
  beforeEach(() => {
    process.env = { ...ENV_BACKUP };
    clearPixGatewayEnv();
    process.env.PIX_GATEWAY = "mercadopago";
  });

  afterEach(() => {
    process.env = { ...ENV_BACKUP };
  });

  it("mercadopago sem token lança 503", () => {
    assert.throws(() => getPixGateway(), (error: unknown) => {
      assert.ok(error instanceof ApiError);
      assert.equal(error.status, 503);
      return true;
    });
  });
});

describe("B48 — API GET /api/billing/gateway/status", () => {
  it("rota existe e não expõe segredos", () => {
    const routePath = resolve(
      __dirname,
      "../src/app/api/billing/gateway/status/route.ts"
    );
    const source = readFileSync(routePath, "utf8");
    assert.match(source, /buildPixGatewayStatusResponse/);
    assert.doesNotMatch(source, /ACCESS_TOKEN|MERCADOPAGO_ACCESS/);
  });

  it("buildPixGatewayStatusResponse inclui providers", () => {
    const status = buildPixGatewayStatusResponse();
    assert.equal(status.ok, true);
    assert.ok(status.providers.mercadopago.available);
    assert.equal(status.providers.asaas.available, false);
  });
});

describe("B48 — plano docs", () => {
  it("docs/plan/b48-pix-gateway.md documenta Mercado Pago v1", () => {
    const doc = readFileSync(
      resolve(__dirname, "../../docs/plan/b48-pix-gateway.md"),
      "utf8"
    );
    assert.match(doc, /Mercado Pago/);
    assert.match(doc, /PIX_GATEWAY/);
    assert.match(doc, /B50/);
  });
});
