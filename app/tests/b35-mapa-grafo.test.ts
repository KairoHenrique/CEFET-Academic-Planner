import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildGrafoEdgesFromRequisitos } from "../src/lib/mapa/mapa-grafo-pure";
import type { RequisitoRow } from "../src/lib/types/db";

describe("B35 mapa grafo edges", () => {
  it("emite solid para pre e dashed para co, só entre nós do grafo", () => {
    const nodes = new Set(["01/1", "02/1", "03/1", "OPT1"]);
    const requisitos: RequisitoRow[] = [
      { disciplina_id: "02/1", requisito_id: "01/1", tipo: "pre" },
      { disciplina_id: "03/1", requisito_id: "02/1", tipo: "pre" },
      { disciplina_id: "02/1", requisito_id: "03/1", tipo: "co" },
      { disciplina_id: "OPT1", requisito_id: "99/9", tipo: "pre" },
      { disciplina_id: "02/1", requisito_id: "01/1", tipo: "pre" },
    ];

    const edges = buildGrafoEdgesFromRequisitos(requisitos, nodes);

    assert.equal(edges.length, 3);
    assert.deepEqual(
      edges.map((edge) => ({
        id: edge.id,
        strokeStyle: edge.strokeStyle,
        source: edge.source,
        target: edge.target,
      })),
      [
        {
          id: "co:03/1->02/1",
          strokeStyle: "dashed",
          source: "03/1",
          target: "02/1",
        },
        {
          id: "pre:01/1->02/1",
          strokeStyle: "solid",
          source: "01/1",
          target: "02/1",
        },
        {
          id: "pre:02/1->03/1",
          strokeStyle: "solid",
          source: "02/1",
          target: "03/1",
        },
      ]
    );
  });
});
