/**
 * Smoke #11 Multi-PPC — seed JSON + catálogo CH por curso (sem Postgres).
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DESIGN_MODA_CH_CATALOG,
  ENG_COMPUTACAO_CH_CATALOG,
  ENG_MECATRONICA_CH_CATALOG,
  getChCatalogForCurso,
  getIntegrationTotalHours,
} from "../src/lib/integralizacao/ch-catalog";
import { loadPpcSeedData } from "../src/lib/db/ppc-seed-loader";
import { resolvePpcEmenta } from "../src/lib/disciplinas/resolve-ppc-ementa";

function assertSeedGraph(cursoId: string, minDisciplinas: number): void {
  const items = loadPpcSeedData(cursoId);
  assert.ok(
    items.length >= minDisciplinas,
    `${cursoId}: esperado ≥${minDisciplinas} disciplinas, veio ${items.length}`
  );

  const codes = new Set(items.map((i) => i.disciplina.codigo));
  for (const item of items) {
    assert.ok(item.disciplina.periodo >= 1);
    assert.ok(item.disciplina.carga_horaria > 0);
    for (const req of item.requisitos) {
      assert.ok(
        codes.has(req.requisito_id),
        `${cursoId}: órfão ${item.disciplina.codigo} → ${req.requisito_id}`
      );
    }
  }
}

describe("#11 Multi-PPC seeds + CH", () => {
  it("carrega Eng. Computação (legado)", () => {
    assertSeedGraph("eng-computacao", 50);
  });

  it("carrega Eng. Mecatrônica com requisitos coerentes", () => {
    assertSeedGraph("eng-mecatronica", 70);
  });

  it("carrega Design de Moda com requisitos coerentes", () => {
    assertSeedGraph("design-moda", 40);
  });

  it("catálogos CH não são stub de Computação", () => {
    assert.notDeepEqual(
      getChCatalogForCurso("eng-mecatronica"),
      ENG_COMPUTACAO_CH_CATALOG
    );
    assert.notDeepEqual(
      getChCatalogForCurso("design-moda"),
      ENG_COMPUTACAO_CH_CATALOG
    );
    assert.equal(
      getChCatalogForCurso("eng-mecatronica"),
      ENG_MECATRONICA_CH_CATALOG
    );
    assert.equal(
      getChCatalogForCurso("design-moda"),
      DESIGN_MODA_CH_CATALOG
    );
    assert.notEqual(
      getIntegrationTotalHours("eng-mecatronica"),
      getIntegrationTotalHours("eng-computacao")
    );
    assert.notEqual(
      getIntegrationTotalHours("design-moda"),
      getIntegrationTotalHours("eng-computacao")
    );
    assert.equal(getIntegrationTotalHours("design-moda"), 2600);
    assert.equal(getIntegrationTotalHours("eng-mecatronica"), 3608);
  });

  it("ementas ricas só para Eng. Computação", () => {
    const meca = resolvePpcEmenta("01/1", "Leitura", 30, "eng-mecatronica");
    const moda = resolvePpcEmenta("01/1", "História", 60, "design-moda");
    const comp = resolvePpcEmenta("01/1", "Cálculo", 90, "eng-computacao");
    assert.match(meca, /A definir/);
    assert.match(moda, /A definir/);
    assert.doesNotMatch(comp, /^A definir/);
  });
});
