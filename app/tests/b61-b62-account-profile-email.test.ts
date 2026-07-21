import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  normalizeOptionalEmail,
  normalizeOptionalPhone,
} from "../src/lib/perfil/normalize-contact-patch";
import { ACCOUNT_EMAIL_KINDS } from "../src/lib/email/account-email-types";
import {
  buildAccountEmailDedupeKey,
  buildWelcomeEmail,
  buildTrialEndedEmail,
  buildPromotionEmail,
} from "../src/lib/email/account-email-templates";
import { buildGreeting, resolveFirstNames } from "../src/lib/email/greeting-name";
import { resolveRenewUrl } from "../src/lib/email/email-links";

describe("B61 — PATCH /api/perfil cloud", () => {
  it("normaliza e valida e-mail de contato", () => {
    assert.equal(normalizeOptionalEmail("  Aluno@CEFETMG.br "), "aluno@cefetmg.br");
    assert.throws(() => normalizeOptionalEmail("invalido"), /e-mail válido/i);
  });

  it("normaliza telefone com 10 ou 11 dígitos", () => {
    assert.equal(normalizeOptionalPhone("(31) 98888-7777"), "31988887777");
    assert.throws(() => normalizeOptionalPhone("123"), /celular válido/i);
  });
});

describe("B62 — fila de e-mails (helpers)", () => {
  it("declara os 5 tipos de e-mail de conta", () => {
    assert.deepEqual(ACCOUNT_EMAIL_KINDS, [
      "promotion",
      "welcome",
      "trial_ended",
      "plan_expiring_soon",
      "plan_ended",
    ]);
  });

  it("gera dedupe_key estável por kind + partes", () => {
    assert.equal(
      buildAccountEmailDedupeKey("welcome", ["user-123"]),
      "welcome:user-123"
    );
  });

  it("monta template de boas-vindas com saudação personalizada", () => {
    const template = buildWelcomeEmail({ firstNames: "Maria Clara" });
    assert.match(template.subject, /Bem-vindo/i);
    assert.match(template.bodyText, /Olá, Maria Clara!/);
  });

  it("boas-vindas sem nome cai em saudação genérica", () => {
    const template = buildWelcomeEmail({ firstNames: null });
    assert.match(template.bodyText, /^Olá!/);
  });

  it("monta template de fim de trial", () => {
    const template = buildTrialEndedEmail({ renewHref: "/planos" });
    assert.match(template.subject, /gratuito|terminou/i);
    assert.match(template.bodyText, /\/planos/);
  });

  it("monta template de promoção com saudação", () => {
    const template = buildPromotionEmail({
      headline: "Novidade no ACME HUB",
      message: "Confira o simulador renovado.",
      firstNames: "João",
    });
    assert.equal(template.subject, "Novidade no ACME HUB");
    assert.match(template.bodyText, /Olá, João!/);
    assert.match(template.bodyText, /simulador renovado/i);
  });
});

describe("B62c — saudação e links de e-mail", () => {
  it("usa apenas os 2 primeiros nomes", () => {
    assert.equal(
      resolveFirstNames("Maria Clara Souza Oliveira"),
      "Maria Clara"
    );
    assert.equal(resolveFirstNames("  João  "), "João");
    assert.equal(resolveFirstNames(""), null);
    assert.equal(resolveFirstNames(null), null);
  });

  it("saudação cai em genérica sem nome", () => {
    assert.equal(buildGreeting("Ana Paula"), "Olá, Ana Paula!");
    assert.equal(buildGreeting(null), "Olá!");
  });

  it("link de renovação é absoluto e aponta para /planos", () => {
    const url = resolveRenewUrl();
    assert.match(url, /^https?:\/\//);
    assert.match(url, /\/planos$/);
  });
});
