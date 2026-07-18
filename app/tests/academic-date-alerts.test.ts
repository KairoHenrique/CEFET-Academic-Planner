import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { buildAcademicDateAlertItems } from "../src/lib/notifications/build-academic-date-alert-items";
import type { CalendarioAcademicoRow } from "../src/lib/types/db";

function row(
  partial: Pick<CalendarioAcademicoRow, "id" | "data_inicio" | "evento">
): CalendarioAcademicoRow {
  return {
    id: partial.id,
    evento: partial.evento,
    data_inicio: partial.data_inicio,
    data_fim: null,
    semestre: "2026.1",
  };
}

function forEvent(
  items: ReturnType<typeof buildAcademicDateAlertItems>,
  id: number
) {
  return items.filter((item) =>
    item.fingerprint.startsWith(`calendar-date-alert:${id}|`)
  );
}

describe("buildAcademicDateAlertItems", () => {
  test("data longe só gera aviso de nova data", () => {
    const items = forEvent(
      buildAcademicDateAlertItems(
        [row({ id: 1, data_inicio: "2026-03-20", evento: "Matrícula Extra" })],
        new Date("2026-03-01T12:00:00")
      ),
      1
    );

    assert.equal(items.length, 1);
    assert.match(items[0]?.fingerprint ?? "", /\|new$/);
    assert.match(items[0]?.title ?? "", /Nova data/i);
  });

  test("1 dia antes gera new + 1d", () => {
    const items = forEvent(
      buildAcademicDateAlertItems(
        [row({ id: 2, data_inicio: "2026-03-02", evento: "Rematrícula Extra" })],
        new Date("2026-03-01T12:00:00")
      ),
      2
    );

    assert.equal(items.length, 2);
    assert.ok(items.some((item) => item.fingerprint.endsWith("|1d")));
    assert.ok(items.some((item) => item.fingerprint.endsWith("|new")));
  });

  test("no dia gera new + 0d e não inclui datas passadas", () => {
    const items = forEvent(
      buildAcademicDateAlertItems(
        [
          row({ id: 3, data_inicio: "2026-03-02", evento: "Provas Extra" }),
          row({ id: 4, data_inicio: "2026-02-28", evento: "Passado Extra" }),
        ],
        new Date("2026-03-02T12:00:00")
      ),
      3
    );

    assert.equal(items.length, 2);
    assert.ok(items.every((item) => item.at === "2026-03-02"));
    assert.ok(items.some((item) => item.fingerprint.endsWith("|0d")));
    assert.equal(
      forEvent(
        buildAcademicDateAlertItems(
          [row({ id: 4, data_inicio: "2026-02-28", evento: "Passado Extra" })],
          new Date("2026-03-02T12:00:00")
        ),
        4
      ).length,
      0
    );
  });
});
