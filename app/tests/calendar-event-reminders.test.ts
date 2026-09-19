import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  buildCalendarEventReminderItems,
  buildClassSessionReminderItems,
  getActiveCalendarReminderSlots,
  getActiveClassReminderSlots,
} from "../src/lib/notifications/calendar-event-reminder-items";
import { brazilWallTimeToUtcDate } from "../src/lib/time/brazil";

/** `now` como instante absoluto a partir de horário de parede em Brasília. */
function atBrazil(dateIso: string, time: string): Date {
  return brazilWallTimeToUtcDate(dateIso, time);
}

describe("calendar-event-reminder-items", () => {
  test("evento longe do prazo só gera aviso de cadastro", () => {
    const now = atBrazil("2026-03-01", "10:00");
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
    const now = atBrazil("2026-03-01", "20:30");
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
    const now = atBrazil("2026-03-02", "09:00");
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

  test("aulas só avisam 30 min antes (fuso Brasília, não UTC)", () => {
    const insideWindow = atBrazil("2026-03-02", "19:35");
    const outsideWindow = atBrazil("2026-03-02", "18:00");
    // 16:00 UTC ≈ 13:00 BRT — fora da janela se aula é 20:00 BRT
    const utcFalsePositive = new Date("2026-03-02T19:35:00.000Z");
    const session = {
      eventId: "aula-AEDI-2026-03-02-0",
      title: "AEDI · 20:00",
      subtitle: "Algoritmos",
      href: "/disciplinas/AEDI",
      startDateIso: "2026-03-02",
      startTime: "20:00",
    };

    assert.deepEqual(getActiveClassReminderSlots(session, insideWindow), ["30m"]);
    assert.deepEqual(getActiveClassReminderSlots(session, outsideWindow), []);
    assert.deepEqual(getActiveClassReminderSlots(session, utcFalsePositive), []);

    const items = buildClassSessionReminderItems([session], insideWindow);
    assert.equal(items.length, 1);
    assert.equal(items[0]?.kind, "class-reminder");
    assert.match(items[0]?.title ?? "", /30 minutos/i);
  });
});
