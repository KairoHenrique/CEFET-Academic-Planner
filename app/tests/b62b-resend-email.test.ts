import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { renderAccountEmailHtml } from "../src/lib/email/account-email-html";
import { createResendAccountEmailSender } from "../src/lib/email/resend-account-email-sender";
import { createBrevoAccountEmailSender } from "../src/lib/email/brevo-account-email-sender";
import { parseEmailAddress } from "../src/lib/email/email-from";
import type { AccountEmailQueueRow } from "../src/lib/email/account-email-types";
import type { ResendConfig } from "../src/lib/email/resend-config";
import type { BrevoConfig } from "../src/lib/email/brevo-config";

const CONFIG: ResendConfig = {
  apiKey: "re_test_key",
  from: "ACME HUB <no-reply@example.com>",
  replyTo: null,
};

const BREVO_CONFIG: BrevoConfig = {
  apiKey: "xkeysib-test",
  sender: { name: "ACME HUB", email: "remetente@example.com" },
  replyTo: null,
};

function buildMessage(
  overrides: Partial<AccountEmailQueueRow> = {}
): AccountEmailQueueRow {
  return {
    id: "id-1",
    userId: null,
    cpf: "12345678900",
    toEmail: "aluno@example.com",
    kind: "welcome",
    dedupeKey: "welcome:12345678900",
    subject: "Bem-vindo",
    bodyText: "Olá!\n\nAcesse https://acme-hub.example.com/planos",
    status: "processing",
    scheduledFor: new Date().toISOString(),
    attempts: 1,
    lastError: null,
    sentAt: null,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("B62b — HTML transacional (anti-XSS)", () => {
  it("escapa markup do conteúdo e converte URL em link", () => {
    const html = renderAccountEmailHtml(
      "Oi <b>",
      "Texto <script>alert(1)</script>\n\nLink https://acme.example/x"
    );
    assert.ok(!html.includes("<script>alert(1)</script>"));
    assert.ok(html.includes("&lt;script&gt;"));
    assert.ok(html.includes('href="https://acme.example/x"'));
  });
});

describe("B62b — Resend sender (classificação de retry)", () => {
  it("rejeita destinatário inválido como falha permanente", async () => {
    const sender = createResendAccountEmailSender(CONFIG);
    const result = await sender(buildMessage({ toEmail: "invalido" }));
    assert.equal(result.ok, false);
    assert.equal(result.retryable, false);
  });

  it("retorna ok em 200", async () => {
    globalThis.fetch = async () =>
      new Response(JSON.stringify({ id: "resend-id" }), { status: 200 });
    const sender = createResendAccountEmailSender(CONFIG);
    const result = await sender(buildMessage());
    assert.equal(result.ok, true);
  });

  it("4xx (exceto 429) é falha permanente", async () => {
    globalThis.fetch = async () =>
      new Response(JSON.stringify({ message: "domain not verified" }), {
        status: 403,
      });
    const sender = createResendAccountEmailSender(CONFIG);
    const result = await sender(buildMessage());
    assert.equal(result.ok, false);
    assert.equal(result.retryable, false);
  });

  it("429 e 5xx são transitórios (re-tentáveis)", async () => {
    globalThis.fetch = async () =>
      new Response(JSON.stringify({ message: "rate limited" }), {
        status: 429,
      });
    const sender = createResendAccountEmailSender(CONFIG);
    const rate = await sender(buildMessage());
    assert.equal(rate.retryable, true);

    globalThis.fetch = async () =>
      new Response(JSON.stringify({ message: "server error" }), {
        status: 500,
      });
    const server = await sender(buildMessage());
    assert.equal(server.retryable, true);
  });

  it("erro de rede é transitório", async () => {
    globalThis.fetch = async () => {
      throw new Error("network down");
    };
    const sender = createResendAccountEmailSender(CONFIG);
    const result = await sender(buildMessage());
    assert.equal(result.ok, false);
    assert.equal(result.retryable, true);
  });
});

describe("B62b — parser de remetente EMAIL_FROM", () => {
  it("extrai nome e e-mail de 'Nome <email>'", () => {
    assert.deepEqual(parseEmailAddress("ACME HUB <no-reply@x.com>"), {
      name: "ACME HUB",
      email: "no-reply@x.com",
    });
  });

  it("aceita e-mail puro (sem nome)", () => {
    assert.deepEqual(parseEmailAddress("  no-reply@x.com  "), {
      name: null,
      email: "no-reply@x.com",
    });
  });
});

describe("B62b — Brevo sender", () => {
  it("rejeita destinatário inválido como falha permanente", async () => {
    const sender = createBrevoAccountEmailSender(BREVO_CONFIG);
    const result = await sender(buildMessage({ toEmail: "invalido" }));
    assert.equal(result.ok, false);
    assert.equal(result.retryable, false);
  });

  it("envia com header api-key e sender estruturado (201)", async () => {
    let captured: { url: string; init: RequestInit } | null = null;
    globalThis.fetch = (async (url: string, init: RequestInit) => {
      captured = { url, init };
      return new Response(JSON.stringify({ messageId: "b-1" }), { status: 201 });
    }) as typeof fetch;

    const sender = createBrevoAccountEmailSender(BREVO_CONFIG);
    const result = await sender(buildMessage());
    assert.equal(result.ok, true);
    assert.ok(captured);
    const { url, init } = captured!;
    assert.equal(url, "https://api.brevo.com/v3/smtp/email");
    const headers = init.headers as Record<string, string>;
    assert.equal(headers["api-key"], "xkeysib-test");
    const payload = JSON.parse(init.body as string);
    assert.deepEqual(payload.sender, {
      name: "ACME HUB",
      email: "remetente@example.com",
    });
    assert.equal(payload.to[0].email, "aluno@example.com");
    assert.ok(typeof payload.htmlContent === "string");
    assert.ok(typeof payload.textContent === "string");
  });

  it("429/5xx são transitórios", async () => {
    globalThis.fetch = async () =>
      new Response(JSON.stringify({ message: "too many" }), { status: 429 });
    const sender = createBrevoAccountEmailSender(BREVO_CONFIG);
    const result = await sender(buildMessage());
    assert.equal(result.retryable, true);
  });
});
