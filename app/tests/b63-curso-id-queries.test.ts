import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it } from "node:test";
import { runWithQueryCursoId } from "../src/lib/auth/account/query-curso-context";
import { getChCatalogForCurso } from "../src/lib/integralizacao/ch-catalog";
import { resolveQueryCursoId } from "../src/lib/db/resolve-query-curso-id";

describe("B63 — curso_id nas queries", () => {
  it("resolveQueryCursoId usa curso da conta no contexto async", () => {
    delete process.env.PLANNER_CURSO_ID;

    const resolved = runWithQueryCursoId("eng-mecatronica", () =>
      resolveQueryCursoId()
    );

    assert.equal(resolved, "eng-mecatronica");
  });

  it("resolveQueryCursoId faz fallback para eng-computacao", () => {
    delete process.env.PLANNER_CURSO_ID;

    const resolved = resolveQueryCursoId();
    assert.equal(resolved, "eng-computacao");
  });

  it("getChCatalogForCurso aceita os tres cursos do cadastro", () => {
    for (const cursoId of [
      "eng-computacao",
      "eng-mecatronica",
      "design-moda",
    ] as const) {
      const catalog = getChCatalogForCurso(cursoId);
      assert.ok(catalog.length > 0);
      assert.equal(catalog[0]?.tipoCh, "Obrigatória");
    }
  });

  it("postgres queries-read filtra disciplinas por curso_id", () => {
    const source = readQueriesReadSource();
    assert.match(source, /FROM disciplinas WHERE curso_id = \$1/);
    assert.match(source, /resolveQueryCursoId/);
    assert.match(source, /FROM requisitos\s+WHERE curso_id = \$1/s);
  });
});

function readQueriesReadSource(): string {
  return readFileSync(
    resolve(__dirname, "../src/lib/db/postgres/queries-read.ts"),
    "utf8"
  );
}
