import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  buildCalendarSyncItems,
  resolveTodayInSaoPaulo,
} from "../src/lib/calendar-sync/build-calendar-sync-items";
import {
  escapeIcsText,
  foldIcsLine,
  renderIcsCalendar,
} from "../src/lib/calendar-sync/render-ics-calendar";
import {
  generateCalendarFeedToken,
  hashCalendarFeedToken,
  isWellFormedCalendarFeedToken,
} from "../src/lib/calendar-sync/calendar-feed-token";
import { parsePatchCalendarSyncSettingsBody } from "../src/lib/calendar-sync/parse-calendar-sync-patch";
import {
  DEFAULT_CALENDAR_SYNC_PREFERENCES,
  type CalendarSyncPreferences,
} from "../src/lib/calendar-sync/types";
import type { CalendarEvent } from "../src/lib/types/calendar";

const TODAY = "2026-10-09";

function event(partial: Partial<CalendarEvent> & Pick<CalendarEvent, "id" | "date">): CalendarEvent {
  return { title: "Item", type: "evento", color: "#000", description: "", ...partial };
}

const SAMPLE_EVENTS: CalendarEvent[] = [
  event({
    id: "aula-GCC101-2026-10-12-0",
    date: "2026-10-12",
    type: "aula",
    title: "Cálculo · 07:00",
    subject: "Cálculo",
    subjectCode: "GCC101",
    color: "#3366ff",
    classTime: { start: "07:00", end: "08:40" },
    location: "Sala 201",
  }),
  event({ id: "tarefa-7", date: "2026-10-15", type: "prova", title: "P1", subject: "Física" }),
  event({
    id: "evento-3",
    date: "2026-10-20",
    timeStart: "14:00",
    timeEnd: "16:00",
    title: "Estudo",
    subject: "Cálculo",
    subjectCode: "GCC101",
    color: "#ff0000",
  }),
  event({ id: "academico-9-inicio", date: "2026-10-30", title: "Matrícula — início" }),
  event({ id: "tarefa-8", date: "2025-01-01", title: "Muito antiga" }),
];

function prefs(overrides: Partial<CalendarSyncPreferences> = {}): CalendarSyncPreferences {
  return {
    categories: { ...DEFAULT_CALENDAR_SYNC_PREFERENCES.categories, ...overrides.categories },
    reminders: overrides.reminders ?? "padrao",
  };
}

describe("buildCalendarSyncItems", () => {
  test("mapeia aula com horário, sala e alarme de 15 min", () => {
    const [aula] = buildCalendarSyncItems(SAMPLE_EVENTS, prefs(), TODAY);
    assert.equal(aula.category, "aulas");
    assert.equal(aula.allDay, false);
    assert.equal(aula.start, "2026-10-12T07:00");
    assert.equal(aula.end, "2026-10-12T08:40");
    assert.equal(aula.location, "Sala 201");
    assert.deepEqual(aula.alarmOffsetsMinutes, [-15]);
  });

  test("tarefa sem hora vira dia inteiro com véspera 18h e dia 8h", () => {
    const tarefa = buildCalendarSyncItems(SAMPLE_EVENTS, prefs(), TODAY).find(
      (item) => item.uid === "tarefa-7@acmehub.com.br"
    );
    assert.ok(tarefa);
    assert.equal(tarefa.allDay, true);
    assert.equal(tarefa.end, "2026-10-16");
    assert.equal(tarefa.title, "Avaliação: P1 — Física");
    assert.deepEqual(tarefa.alarmOffsetsMinutes, [-360, 480]);
  });

  test("respeita categorias desligadas e a janela de datas", () => {
    const items = buildCalendarSyncItems(
      SAMPLE_EVENTS,
      prefs({ categories: { aulas: false, tarefas: true, eventos: true, academico: false } }),
      TODAY
    );
    assert.deepEqual(
      items.map((item) => item.category),
      ["tarefas", "eventos"]
    );
  });

  test("modo so_tarefas tira alarme de aula e nenhum tira todos", () => {
    const soTarefas = buildCalendarSyncItems(SAMPLE_EVENTS, prefs({ reminders: "so_tarefas" }), TODAY);
    assert.deepEqual(soTarefas[0].alarmOffsetsMinutes, []);
    assert.ok(soTarefas[1].alarmOffsetsMinutes.length > 0);

    const nenhum = buildCalendarSyncItems(SAMPLE_EVENTS, prefs({ reminders: "nenhum" }), TODAY);
    assert.ok(nenhum.every((item) => item.alarmOffsetsMinutes.length === 0));
  });

  test("agrupa por matéria usando a cor da disciplina (não a do evento manual)", () => {
    const items = buildCalendarSyncItems(SAMPLE_EVENTS, prefs(), TODAY);
    const aula = items.find((item) => item.category === "aulas");
    const evento = items.find((item) => item.category === "eventos");
    const academico = items.find((item) => item.category === "academico");
    assert.deepEqual(aula?.subject, { key: "GCC101", label: "Cálculo", color: "#3366FF" });
    assert.equal(evento?.subject?.color, "#3366FF");
    assert.equal(academico?.subject, undefined);
  });

  test("hoje é calculado no fuso de Brasília", () => {
    assert.equal(resolveTodayInSaoPaulo(new Date("2026-10-10T02:00:00Z")), "2026-10-09");
  });
});

describe("renderIcsCalendar", () => {
  const ics = renderIcsCalendar(buildCalendarSyncItems(SAMPLE_EVENTS, prefs(), TODAY), {
    calendarName: "ACME HUB",
    now: new Date("2026-10-09T12:00:00Z"),
  });

  test("gera VCALENDAR válido com CRLF e fuso de Brasília", () => {
    assert.ok(ics.startsWith("BEGIN:VCALENDAR\r\n"));
    assert.ok(ics.endsWith("END:VCALENDAR\r\n"));
    assert.ok(ics.includes("DTSTART;TZID=America/Sao_Paulo:20261012T070000"));
    assert.ok(ics.includes("DTSTART;VALUE=DATE:20261015"));
    assert.ok(ics.includes("TRIGGER:-PT15M"));
    assert.ok(ics.includes("TRIGGER:-PT6H"));
    assert.ok(ics.includes("TRIGGER:PT8H"));
    assert.ok(!/\r\n(?! )[^\r]{76,}/.test(ics), "nenhuma linha passa de 75 caracteres");
  });

  test("escapa texto e dobra linhas longas sem quebrar UTF-8", () => {
    assert.equal(escapeIcsText("a,b;c\\d\ne"), "a\\,b\\;c\\\\d\\ne");
    const folded = foldIcsLine(`SUMMARY:${"ã".repeat(60)}`);
    for (const line of folded.split("\r\n")) {
      assert.ok(new TextEncoder().encode(line).length <= 75);
    }
    assert.equal(folded.replace(/\r\n /g, ""), `SUMMARY:${"ã".repeat(60)}`);
  });
});

describe("calendar feed token", () => {
  test("gera token base64url de 43 caracteres e hash SHA-256 hex", async () => {
    const token = generateCalendarFeedToken();
    assert.ok(isWellFormedCalendarFeedToken(token));
    assert.match(await hashCalendarFeedToken(token), /^[0-9a-f]{64}$/);
    assert.ok(!isWellFormedCalendarFeedToken("../../etc/passwd"));
  });
});

describe("parsePatchCalendarSyncSettingsBody", () => {
  test("aceita patch parcial válido", () => {
    assert.deepEqual(parsePatchCalendarSyncSettingsBody({ categories: { aulas: false } }), {
      categories: { aulas: false },
    });
  });

  test("rejeita campos, categorias e modos desconhecidos", () => {
    assert.throws(() => parsePatchCalendarSyncSettingsBody({ userId: "x" }));
    assert.throws(() => parsePatchCalendarSyncSettingsBody({ categories: { notas: true } }));
    assert.throws(() => parsePatchCalendarSyncSettingsBody({ categories: { aulas: "sim" } }));
    assert.throws(() => parsePatchCalendarSyncSettingsBody({ reminders: "sempre" }));
    assert.throws(() => parsePatchCalendarSyncSettingsBody({}));
  });
});
