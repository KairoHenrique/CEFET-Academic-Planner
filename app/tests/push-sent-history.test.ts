import assert from "node:assert/strict";
import { describe, test } from "node:test";

/**
 * Espelha a regra de parse do push-sent-fingerprints-store
 * (legado sem `pushed` = já enviado; novo discovery = pushed false).
 */
function parseHistoryForTest(raw: string): Map<
  string,
  { fingerprint: string; pushed: boolean; isRead: boolean }
> {
  const map = new Map<
    string,
    { fingerprint: string; pushed: boolean; isRead: boolean }
  >();
  const parsed = JSON.parse(raw) as unknown[];
  for (const item of parsed) {
    if (typeof item === "string") {
      map.set(item, { fingerprint: item, pushed: true, isRead: true });
    } else if (item && typeof item === "object" && "fingerprint" in item) {
      const row = item as {
        fingerprint: string;
        pushed?: boolean;
        isRead?: boolean;
      };
      const hasPushed = typeof row.pushed === "boolean";
      map.set(row.fingerprint, {
        fingerprint: row.fingerprint,
        pushed: hasPushed ? Boolean(row.pushed) : true,
        isRead: Boolean(row.isRead),
      });
    }
  }
  return map;
}

describe("push history — evita spam de Nova Tarefa", () => {
  test("legado sem campo pushed conta como já enviado", () => {
    const history = parseHistoryForTest(
      JSON.stringify([
        "task:g00|desafio 1|2026-09-10",
        {
          fingerprint: "task:g00|desafio 2|2026-09-11",
          discoveredAt: "2026-09-01T12:00:00.000Z",
          isRead: false,
        },
      ])
    );

    const alreadySent = new Set(
      [...history.values()].filter((s) => s.pushed).map((s) => s.fingerprint)
    );

    assert.equal(alreadySent.has("task:g00|desafio 1|2026-09-10"), true);
    assert.equal(alreadySent.has("task:g00|desafio 2|2026-09-11"), true);
  });

  test("discovery novo com pushed:false ainda não foi enviado", () => {
    const history = parseHistoryForTest(
      JSON.stringify([
        {
          fingerprint: "task:g00|nova|2026-09-20",
          discoveredAt: "2026-09-03T21:00:00.000Z",
          isRead: false,
          pushed: false,
        },
      ])
    );

    const alreadySent = new Set(
      [...history.values()].filter((s) => s.pushed).map((s) => s.fingerprint)
    );

    assert.equal(alreadySent.has("task:g00|nova|2026-09-20"), false);
  });
});
