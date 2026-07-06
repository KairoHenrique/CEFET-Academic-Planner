import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it } from "node:test";
import {
  LEGAL_PRIVACY_VERSION,
  LEGAL_TERMS_VERSION,
  buildLegalMeta,
} from "../src/lib/legal/constants";
import { parseLegalConsent } from "../src/lib/legal/parse-legal-consent";
import { parseRegisterAccountRequest } from "../src/lib/auth/account/parse-account-request";
import { isPublicAppPath } from "../src/lib/routing/public-paths";

const MIGRATION_PATH = resolve(
  __dirname,
  "../../supabase/migrations/20260706000000_l1_legal_consent.sql"
);

function validAcceptedLegal() {
  return {
    terms: true,
    privacy: true,
    termsVersion: LEGAL_TERMS_VERSION,
    privacyVersion: LEGAL_PRIVACY_VERSION,
  };
}

describe("L1 — termos + LGPD", () => {
  it("migration adiciona colunas de consentimento versionado", () => {
    const sql = readFileSync(MIGRATION_PATH, "utf8");
    assert.match(sql, /terms_version/);
    assert.match(sql, /terms_accepted_at/);
    assert.match(sql, /privacy_version/);
    assert.match(sql, /privacy_accepted_at/);
  });

  it("buildLegalMeta expõe versões e rotas públicas", () => {
    const meta = buildLegalMeta();
    assert.equal(meta.termsVersion, LEGAL_TERMS_VERSION);
    assert.equal(meta.privacyVersion, LEGAL_PRIVACY_VERSION);
    assert.equal(meta.routes.terms, "/termos");
    assert.equal(meta.routes.privacy, "/privacidade");
  });

  it("parseLegalConsent rejeita aceite ausente ou versão stale", () => {
    assert.throws(
      () => parseLegalConsent({ acceptedLegal: { terms: false, privacy: true } }),
      /Termos de Uso/
    );

    assert.throws(
      () =>
        parseLegalConsent({
          acceptedLegal: {
            terms: true,
            privacy: true,
            termsVersion: "2020-01-01",
            privacyVersion: LEGAL_PRIVACY_VERSION,
          },
        }),
      /Termos de Uso desatualizada/
    );
  });

  it("parse cadastro exige acceptedLegal com versão vigente", () => {
    const parsed = parseRegisterAccountRequest({
      email: "aluno@cefetmg.br",
      telefone: "(31) 98888-7777",
      cpf: "111.444.777-35",
      cursoId: "eng-computacao",
      password: "sigaa123",
      acceptedLegal: validAcceptedLegal(),
    });

    assert.equal(parsed.legalConsent.termsVersion, LEGAL_TERMS_VERSION);
    assert.equal(parsed.legalConsent.privacyVersion, LEGAL_PRIVACY_VERSION);
  });

  it("rotas legais são públicas sem autenticação", () => {
    assert.equal(isPublicAppPath("/termos"), true);
    assert.equal(isPublicAppPath("/privacidade"), true);
    assert.equal(isPublicAppPath("/"), false);
  });
});
