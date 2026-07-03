import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  buildCalendarEventReminderItems,
  buildClassSessionReminderItems,
  getActiveClassReminderSlots,
} from "../src/lib/notifications/calendar-event-reminder-items";

describe("calendar-event-reminder-items", () => {
  test("eventos manuais geram lembrete 24h antes", () => {
    const now = new Date("2026-03-01T20:30:00");

    const items = buildCalendarEventReminderItems(
      [
        {
          eventId: "evento-1",
          title: "Estudo em grupo",
          subtitle: "Calendário",
          href: "/calendario",
          startDateIso: "2026-03-02",
          startTime: "20:00",
        },
      ],
      now
    );

    assert.equal(items.length, 1);
    assert.equal(items[0]?.kind, "calendar-event-reminder");
  });

  test("aulas só avisam 30 min antes", () => {
    const insideWindow = new Date("2026-03-02T19:35:00");
    const outsideWindow = new Date("2026-03-02T18:00:00");
    const session = {
      eventId: "aula-AEDI-2026-03-02-0",
      title: "AEDI · 07:30",
      subtitle: "Algoritmos",
      href: "/disciplinas/AEDI",
      startDateIso: "2026-03-02",
      startTime: "20:00",
    };

    assert.deepEqual(getActiveClassReminderSlots(session, insideWindow), ["30m"]);
    assert.deepEqual(getActiveClassReminderSlots(session, outsideWindow), []);

    const items = buildClassSessionReminderItems([session], insideWindow);
    assert.equal(items.length, 1);
    assert.equal(items[0]?.kind, "class-reminder");
    assert.match(items[0]?.title ?? "", /30 minutos/i);
  });
});
