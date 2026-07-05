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

  it("monta template de boas-vindas", () => {
    const template = buildWelcomeEmail({ contactEmail: "aluno@test.com" });
    assert.match(template.subject, /Bem-vindo/i);
    assert.match(template.bodyText, /aluno@test.com/);
  });

  it("monta template de fim de trial", () => {
    const template = buildTrialEndedEmail({ renewHref: "/planos" });
    assert.match(template.subject, /trial/i);
    assert.match(template.bodyText, /\/planos/);
  });

  it("monta template de promoção", () => {
    const template = buildPromotionEmail({
      headline: "Novidade no ACME HUB",
      message: "Confira o simulador renovado.",
    });
    assert.equal(template.subject, "Novidade no ACME HUB");
    assert.match(template.bodyText, /simulador renovado/i);
  });
});
