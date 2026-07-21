import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import { buildDevAccountRef } from "../src/lib/dev-panel/dev-account-ref";
import { toDevAccountPublicView } from "../src/lib/dev-panel/sanitize-dev-account";
import { sanitizeAuditDetail } from "../src/lib/dev-panel/sanitize-audit-detail";
import type { DevAccountRecord } from "../src/lib/dev-panel/types";
import {
  assertCredentialHardeningForRuntime,
  isProductionRuntime,
} from "../src/lib/security/credential-hardening";
import { redactSensitiveText } from "../src/lib/security/safe-log";

const ENV_BACKUP = { ...process.env };

describe("B71 — endurecimento de credenciais", () => {
  beforeEach(() => {
    process.env = { ...ENV_BACKUP, ...process.env };
    process.env.CREDENTIALS_ENCRYPTION_KEY = "test-credential-key-32chars-min";
  });

  afterEach(() => {
    process.env = { ...ENV_BACKUP };
  });

  it("buildDevAccountRef usa userId em cloud e HMAC no sqlite", () => {
    const cloudRef = buildDevAccountRef({
      userId: "11111111-1111-4111-8111-111111111111",
      cpf: "12345678901",
    });
    assert.equal(cloudRef, "11111111-1111-4111-8111-111111111111");

    const sqliteRef = buildDevAccountRef({ cpf: "12345678901" });
    assert.notEqual(sqliteRef, "12345678901");
    assert.ok(sqliteRef.length > 8);
  });

  it("toDevAccountPublicView não expõe CPF completo", () => {
    const record: DevAccountRecord = {
      userId: "11111111-1111-4111-8111-111111111111",
      cpf: "12345678901",
      cpfMasked: "***.***.***-8901",
      cpfLast4: "8901",
      displayName: "Aluno",
      cursoId: "eng-computacao",
      email: "aluno@cefetmg.br",
      credentialSaved: true,
      lastSyncAt: null,
      subscription: null,
    };

    const view = toDevAccountPublicView(record);
    assert.equal(view.accountRef, record.userId);
    assert.equal(view.cpfMasked, record.cpfMasked);
    assert.ok(!("cpf" in view));
  });

  it("sanitizeAuditDetail mascara CPF e remove senha", () => {
    const sanitized = sanitizeAuditDetail({
      cpf: "12345678901",
      password: "sigaa-secret",
      nested: { sigaa_password_enc: "cipher" },
    });

    assert.equal(sanitized.password, "[redacted]");
    assert.equal(sanitized.cpfMasked, "***.***.***-8901");
    assert.equal(sanitized.cpfLast4, "8901");
    assert.deepEqual(sanitized.nested, { sigaa_password_enc: "[redacted]" });
  });

  it("redactSensitiveText remove CPF e e-mail", () => {
    const redacted = redactSensitiveText(
      "falha cpf=12345678901 email=user@cefetmg.br"
    );
    assert.match(redacted, /\[cpf-redacted\]/);
    assert.match(redacted, /\[email-redacted\]/);
  });

  it("assertCredentialHardeningForRuntime exige chave em produção", () => {
    process.env.NODE_ENV = "production";
    delete process.env.CREDENTIALS_ENCRYPTION_KEY;

    assert.throws(
      () => assertCredentialHardeningForRuntime("teste"),
      /CREDENTIALS_ENCRYPTION_KEY/
    );
    assert.equal(isProductionRuntime(), true);
  });
});
