import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, it } from "node:test";
import { APP_CURSO_IDS } from "../src/lib/auth/account/curso-catalog";
import { isValidCpf, normalizeCpf } from "../src/lib/auth/account/cpf";
import {
  isValidEmail,
  isValidTelefone,
  normalizeTelefone,
} from "../src/lib/auth/account/contact-fields";
import { buildInternalAuthEmail } from "../src/lib/auth/account/internal-auth-email";
import {
  parseLoginAccountRequest,
  parseRegisterAccountRequest,
} from "../src/lib/auth/account/parse-account-request";

const MIGRATION_PATH = resolve(
  __dirname,
  "../../supabase/migrations/20260704130000_b44_app_accounts.sql"
);

describe("B44 — conta do aluno", () => {
  it("migration declara app_profiles com FK auth.users e índice único de CPF", () => {
    const sql = readFileSync(MIGRATION_PATH, "utf8");
    assert.match(sql, /CREATE TABLE IF NOT EXISTS app_profiles/);
    assert.match(sql, /REFERENCES auth\.users \(id\)/);
    assert.match(sql, /idx_app_profiles_cpf/);
    assert.match(sql, /design-moda/);
  });

  it("valida CPF com dígitos verificadores", () => {
    assert.equal(isValidCpf("111.444.777-35"), true);
    assert.equal(isValidCpf("11144477735"), true);
    assert.equal(isValidCpf("123.456.789-00"), false);
    assert.equal(isValidCpf("00000000000"), false);
  });

  it("normaliza CPF e telefone", () => {
    assert.equal(normalizeCpf("111.444.777-35"), "11144477735");
    assert.equal(normalizeTelefone("(31) 98888-7777"), "31988887777");
    assert.equal(isValidTelefone("31988887777"), true);
  });

  it("gera e-mail interno Supabase a partir do CPF", () => {
    assert.equal(
      buildInternalAuthEmail("111.444.777-35"),
      "cpf.11144477735@accounts.acme-hub.internal"
    );
  });

  it("parse cadastro exige curso_id válido e e-mail", () => {
    const parsed = parseRegisterAccountRequest({
      email: "aluno@cefetmg.br",
      telefone: "(31) 98888-7777",
      cpf: "111.444.777-35",
      cursoId: "eng-computacao",
      password: "sigaa123",
    });

    assert.equal(parsed.cpf, "11144477735");
    assert.equal(parsed.cursoId, "eng-computacao");
    assert.ok(isValidEmail(parsed.email));
    assert.ok(APP_CURSO_IDS.includes(parsed.cursoId));
  });

  it("parse login aceita somente CPF + senha", () => {
    const parsed = parseLoginAccountRequest({
      cpf: "11144477735",
      password: "sigaa123",
    });

    assert.equal(parsed.cpf, "11144477735");
    assert.equal(parsed.password, "sigaa123");
  });
});
