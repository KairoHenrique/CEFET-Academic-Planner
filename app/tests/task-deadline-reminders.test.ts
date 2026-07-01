import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  buildTaskDeadlineReminderItems,
  getActiveTaskReminderSlots,
} from "../src/lib/notifications/task-deadline-reminders";

describe("task deadline reminders", () => {
  test("24h antes da entrega gera lembrete", () => {
    const due = new Date(2026, 5, 26, 23, 59, 0, 0);
    const now = new Date(due.getTime() - 20 * 60 * 60 * 1000);

    const slots = getActiveTaskReminderSlots(
      { dueDateIso: "2026-06-26", dueTime: "23:59" },
      now
    );

    assert.deepEqual(slots, ["24h"]);
  });

  test("1h antes da entrega gera lembrete urgente", () => {
    const due = new Date(2026, 5, 26, 15, 0, 0, 0);
    const now = new Date(due.getTime() - 45 * 60 * 1000);

    const slots = getActiveTaskReminderSlots(
      { dueDateIso: "2026-06-26", dueTime: "15:00" },
      now
    );

    assert.deepEqual(slots, ["24h", "1h"]);
  });

  test("monta item de lembrete com fingerprint estável", () => {
    const items = buildTaskDeadlineReminderItems(
      [
        {
          id: 1,
          disciplinaId: "CALC",
          title: "Lista 1",
          subtitle: "Cálculo",
          href: "/disciplinas/CALC",
          dueDateIso: "2026-06-26",
          dueTime: "23:59",
        },
      ],
      new Date(2026, 5, 26, 23, 0, 0, 0)
    );

    assert.equal(items.length, 2);
    assert.equal(
      items[0].fingerprint,
      "task-reminder:calc|lista 1|2026-06-26|24h"
    );
    assert.equal(
      items[1].fingerprint,
      "task-reminder:calc|lista 1|2026-06-26|1h"
    );
  });

  test("fora da janela de 24h não gera lembrete", () => {
    const due = new Date(2026, 5, 28, 23, 59, 0, 0);
    const now = new Date(due.getTime() - 30 * 60 * 60 * 1000);

    const slots = getActiveTaskReminderSlots(
      { dueDateIso: "2026-06-28", dueTime: "23:59" },
      now
    );

    assert.deepEqual(slots, []);
  });
});
