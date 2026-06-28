/**
 * Apelidos automáticos de disciplinas (sync SIGAA + PPC).
 */
import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  suggestSubjectNickname,
  resolveSubjectShortLabel,
} from "../src/lib/disciplinas/subject-display-name";

describe("subject-display-name — apelidos SIGAA", () => {
  test("usa código PPC curto quando disponível", () => {
    assert.equal(
      suggestSubjectNickname("Algoritmos e Estruturas de Dados I", "AEDI"),
      "AEDI"
    );
  });

  test("gera sigla a partir do nome longo do portal", () => {
    assert.equal(
      suggestSubjectNickname(
        "ALGORITMOS E ESTRUTURAS DE DADOS I",
        "ALGORITMOS-E-ESTRUTURAS"
      ),
      "AEDI"
    );
    assert.equal(
      suggestSubjectNickname(
        "ARQUITETURA E ORGANIZAÇÃO DE COMPUTADORES I",
        "ARQUITETURA-E-ORGANIZ"
      ),
      "AOCI"
    );
    assert.equal(
      suggestSubjectNickname(
        "LABORATÓRIO DE ARQUITETURA E ORGANIZAÇÃO DE COMPUTADORES I",
        "LABORATORIO-DE-ARQ"
      ),
      "LAOCI"
    );
    assert.equal(
      suggestSubjectNickname(
        "LABORATÓRIO DE ALGORITMOS E ESTRUTURAS DE DADOS I",
        "LABORATORIO-DE-ALG"
      ),
      "LAEDI"
    );
    assert.equal(
      suggestSubjectNickname(
        "EMPREENDEDORISMO E PLANO DE NEGÓCIOS",
        "EMPREENDEDORISMO-E-"
      ),
      "EMPREEND"
    );
    assert.equal(
      suggestSubjectNickname("INTRODUÇÃO À SOCIOLOGIA", "INTRODUCAO-A-SOC"),
      "SOCIOLOGIA"
    );
  });

  test("resolveSubjectShortLabel cai no nome quando apelido é nulo", () => {
    assert.equal(
      resolveSubjectShortLabel(
        "ALGORITMOS-E-ESTRUTURAS",
        null,
        "ALGORITMOS E ESTRUTURAS DE DADOS I"
      ),
      "AEDI"
    );
  });
});
