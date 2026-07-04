/**
 * Apelidos automáticos de disciplinas (sync SIGAA + PPC).
 */
import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { buildDisciplineShortLabelRegistry } from "../src/lib/disciplinas/subject-display-name";
import { extractNicknameSourceName } from "../src/lib/disciplinas/subject-nickname-core";
import {
  suggestSubjectNickname,
  suggestDisciplineShortLabel,
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

  test("inglês instrumental II não vira sigla III", () => {
    assert.equal(
      suggestDisciplineShortLabel("Inglês Instrumental II"),
      "INGII"
    );
    assert.equal(
      suggestSubjectNickname("INGLES INSTRUMENTAL II", "G05IINT2.0"),
      "INGII"
    );
  });

  test("suggestDisciplineShortLabel usa nome, não código PPC", () => {
    assert.equal(
      suggestDisciplineShortLabel(
        "Cálculo com Funções de uma Variável Real"
      ),
      "CALCUL"
    );
  });

  test("tópicos especiais usam só o trecho após dois-pontos", () => {
    const nome =
      "Tópicos Especiais em Sistemas Inteligentes: Visão Computacional";

    assert.equal(
      extractNicknameSourceName(nome),
      "Visão Computacional"
    );
    assert.equal(suggestDisciplineShortLabel(nome), "VISCOMP");
    assert.notEqual(suggestDisciplineShortLabel(nome), "TESI");
  });

  test("registry evita apelidos duplicados entre tópicos parecidos", () => {
    const registry = buildDisciplineShortLabelRegistry([
      {
        code: "GT01",
        name:
          "Tópicos Especiais em Sistemas Inteligentes: Visão Computacional",
      },
      {
        code: "GT02",
        name: "Tópicos Especiais em Sistemas Inteligentes: Deep Learning",
      },
    ]);

    const first = registry.get("GT01");
    const second = registry.get("GT02");

    assert.ok(first);
    assert.ok(second);
    assert.notEqual(first, second);
    assert.equal(first, "VISCOMP");
    assert.equal(second, "DEELEAR");
  });
});
