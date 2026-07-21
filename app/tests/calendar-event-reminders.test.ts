import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  buildCalendarEventReminderItems,
  buildClassSessionReminderItems,
  getActiveCalendarReminderSlots,
  getActiveClassReminderSlots,
} from "../src/lib/notifications/calendar-event-reminder-items";

describe("calendar-event-reminder-items", () => {
  test("evento longe do prazo só gera aviso de cadastro", () => {
    const now = new Date("2026-03-01T10:00:00");
    const event = {
      eventId: "evento-1",
      title: "Estudo em grupo",
      subtitle: "Calendário",
      href: "/calendario",
      startDateIso: "2026-03-10",
      startTime: "20:00",
    };

    assert.deepEqual(getActiveCalendarReminderSlots(event, now), ["new"]);

    const items = buildCalendarEventReminderItems([event], now);
    assert.equal(items.length, 1);
    assert.equal(items[0]?.title, "Novo evento");
    assert.match(items[0]?.fingerprint ?? "", /\|new$/);
  });

  test("1 dia antes gera cadastro + amanhã", () => {
    const now = new Date("2026-03-01T20:30:00");
    const event = {
      eventId: "evento-1",
      title: "Estudo em grupo",
      subtitle: "Calendário",
      href: "/calendario",
      startDateIso: "2026-03-02",
      startTime: "20:00",
    };

    assert.deepEqual(getActiveCalendarReminderSlots(event, now), ["new", "1d"]);

    const items = buildCalendarEventReminderItems([event], now);
    assert.equal(items.length, 2);
    assert.ok(items.some((item) => item.title === "Evento amanhã"));
  });

  test("no dia gera cadastro + hoje", () => {
    const now = new Date("2026-03-02T09:00:00");
    const event = {
      eventId: "evento-1",
      title: "Estudo em grupo",
      subtitle: "Calendário",
      href: "/calendario",
      startDateIso: "2026-03-02",
      startTime: "20:00",
    };

    assert.deepEqual(getActiveCalendarReminderSlots(event, now), ["new", "0d"]);
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
