/**
 * Suite B66: calendário acadêmico — semestre, parser HTML, persist, robô isolado.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, before, describe, test } from "node:test";

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "planner-b66-"));

process.env.DB_PATH = path.join(tmpDir, "test.db");
process.env.SIGAA_SCRAPER_MOCK = "true";

const SAMPLE_HTML = `
<html><body>
<h2>Calendário Acadêmico 2026.1</h2>
<table class="listagem">
  <tr><th>Evento</th><th>Período</th></tr>
  <tr><td>Início das aulas</td><td>10/02/2026</td></tr>
  <tr><td>Recesso</td><td>25/06/2026 a 12/07/2026</td></tr>
  <tr><td>Provas finais</td><td>14/07/2026 – 25/07/2026</td></tr>
</table>
</body></html>
`;

before(async () => {
  const { ensureDbReady } = await import("../src/lib/db/bootstrap");
  ensureDbReady();
});

after(() => {
  try {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  } catch {
    // Windows pode manter lock no SQLite temporário
  }
});

describe("B66 — semestre letivo pela data", () => {
  test("jul/2026 prioriza 2026.1 e tenta 2026.2 na transição", async () => {
    const { resolveCalendarioSemesterTargets, resolveAcademicSemesterLabel } =
      await import("../src/lib/academic/resolve-academic-semester");

    const july = new Date("2026-07-03T12:00:00");
    assert.equal(resolveAcademicSemesterLabel(july), "2026.1");
    assert.deepEqual(resolveCalendarioSemesterTargets(july), ["2026.1", "2026.2"]);
  });

  test("ago/2026 usa semestre .2", async () => {
    const { resolveAcademicSemesterLabel } = await import(
      "../src/lib/academic/resolve-academic-semester"
    );
    const august = new Date("2026-08-15T12:00:00");
    assert.equal(resolveAcademicSemesterLabel(august), "2026.2");
  });

  test("ago/2026 exibe 2026.2 à esquerda e 2027.1 à direita", async () => {
    const {
      resolveAcademicSemesterDisplayPair,
      resolveNextAcademicSemesterLabel,
    } = await import("../src/lib/academic/resolve-academic-semester");

    const august = new Date("2026-08-15T12:00:00");
    assert.equal(resolveNextAcademicSemesterLabel(august), "2027.1");
    assert.deepEqual(resolveAcademicSemesterDisplayPair(august), [
      "2026.2",
      "2027.1",
    ]);
  });

  test("troca colunas um dia antes do Período Letivo", async () => {
    const {
      resolveAcademicSemesterDisplayPair,
      resolveCurrentSemesterFromPeriodStarts,
      extractSemesterPeriodStarts,
    } = await import("../src/lib/academic/resolve-academic-semester");

    const rows = [
      {
        id: 1,
        evento: "Período Letivo",
        data_inicio: "2026-03-02",
        data_fim: "2026-07-06",
        semestre: "2026.1",
      },
      {
        id: 2,
        evento: "Período Letivo",
        data_inicio: "2026-08-05",
        data_fim: "2026-12-07",
        semestre: "2026.2",
      },
    ] as import("../src/lib/types/db").CalendarioAcademicoRow[];

    const periodStarts = extractSemesterPeriodStarts(rows);
    const eve = new Date("2026-08-04T12:00:00");
    const startDay = new Date("2026-08-05T12:00:00");

    assert.equal(
      resolveCurrentSemesterFromPeriodStarts(periodStarts, eve),
      "2026.2"
    );
    assert.deepEqual(resolveAcademicSemesterDisplayPair(eve, rows), [
      "2026.2",
      "2027.1",
    ]);
    assert.deepEqual(resolveAcademicSemesterDisplayPair(startDay, rows), [
      "2026.2",
      "2027.1",
    ]);

    const dayBefore = new Date("2026-08-03T12:00:00");
    assert.equal(
      resolveCurrentSemesterFromPeriodStarts(periodStarts, dayBefore),
      "2026.1"
    );
    assert.deepEqual(resolveAcademicSemesterDisplayPair(dayBefore, rows), [
      "2026.1",
      "2026.2",
    ]);
  });
});

describe("B66 — parser HTML", () => {
  test("extrai eventos e intervalos de datas", async () => {
    const { parseCalendarioHtml } = await import(
      "../src/lib/scraper/calendario/parse-calendario-html"
    );

    const snapshot = parseCalendarioHtml(SAMPLE_HTML, {
      semestreAlvo: ["2026.1"],
    });

    assert.equal(snapshot.eventos.length, 3);
    assert.equal(snapshot.eventos[0]?.evento, "Início das aulas");
    assert.equal(snapshot.eventos[0]?.dataInicio, "2026-02-10");
    assert.equal(snapshot.eventos[1]?.dataFim, "2026-07-12");
    assert.equal(snapshot.eventos[2]?.dataInicio, "2026-07-14");
    assert.equal(snapshot.eventos[2]?.dataFim, "2026-07-25");
  });

  test("rejeita HTML do portal discente (turmas do semestre)", async () => {
    const { parseCalendarioHtml } = await import(
      "../src/lib/scraper/calendario/parse-calendario-html"
    );
    const portalSnippet = `
      <h4>Turmas do Semestre</h4>
      <table>
        <tr><th>Componente Curricular</th><th>Horário</th></tr>
        <tr><td>ALGORITMOS E ESTRUTURAS DE DADOS I</td><td>6M56 (23/02/2026 - 04/07/2026)</td></tr>
      </table>
    `;

    const snapshot = parseCalendarioHtml(portalSnippet, {
      semestreAlvo: ["2026.1"],
    });

    assert.equal(snapshot.eventos.length, 0);
    assert.equal(snapshot.unavailable, true);
  });

  test("parseia formato SIGAA Período Letivo / Matrícula", async () => {
    const { parseCalendarioHtml } = await import(
      "../src/lib/scraper/calendario/parse-calendario-html"
    );

    const html = `
      <h2>Calendário 2026.1</h2>
      <table>
        <tr><td>Período Letivo:</td><td>De 02/03/2026 até 06/07/2026</td></tr>
        <tr><td>Matrícula OnLine:</td><td>De 22/01/2026 até 25/01/2026</td></tr>
        <tr><td>Matrícula Extraordinária:</td><td>De 05/03/2026 até 06/03/2026</td></tr>
        <tr><td>Rematrícula:</td><td>De 29/01/2026 até 01/02/2026</td></tr>
        <tr><td>Ajustes das Rematrículas/Turmas:</td><td>De 09/03/2026 até 10/03/2026</td></tr>
      </table>
    `;

    const snapshot = parseCalendarioHtml(html, {
      semestreAlvo: ["2026.1"],
      semestreContext: "2026.1",
    });

    assert.equal(snapshot.eventos.length, 5);
    assert.equal(snapshot.eventos[0]?.evento, "Período Letivo");
    assert.equal(snapshot.eventos[0]?.dataInicio, "2026-03-02");
    assert.equal(snapshot.eventos[0]?.dataFim, "2026-07-06");
    assert.equal(snapshot.eventos[0]?.semestre, "2026.1");
  });

  test("De prefixo em datas institucionais", async () => {
    const { parseCalendarioDateRange } = await import(
      "../src/lib/scraper/calendario/parse-calendario-html"
    );
    const parsed = parseCalendarioDateRange(
      "De 02/03/2026 até 06/07/2026",
      "2026"
    );
    assert.ok(parsed);
    assert.equal(parsed?.dataInicio, "2026-03-02");
    assert.equal(parsed?.dataFim, "2026-07-06");
  });

  test("ignora Não Definido e mantém só eventos importantes", async () => {
    const { parseCalendarioHtml } = await import(
      "../src/lib/scraper/calendario/parse-calendario-html"
    );

    const html = `
      <h2>Visualização do Calendário Acadêmico</h2>
      <table>
        <tr><td>Ano/Semestre:</td><td>2026/2</td></tr>
        <tr><td>Período Letivo:</td><td>De 05/08/2026 até 07/12/2026</td></tr>
        <tr><td>Matrícula OnLine:</td><td>Não Definido</td></tr>
        <tr><td>Consolidação de Turmas:</td><td>Não Definido</td></tr>
        <tr><td>Vigente:</td><td>Não</td></tr>
      </table>
    `;

    const snapshot = parseCalendarioHtml(html, { semestreAlvo: ["2026.2"] });

    assert.equal(snapshot.eventos.length, 1);
    assert.equal(snapshot.eventos[0]?.evento, "Período Letivo");
    assert.equal(snapshot.eventos[0]?.semestre, "2026.2");
  });

  test("ignora lixo de script no HTML", async () => {
    const { parseCalendarioHtml } = await import(
      "../src/lib/scraper/calendario/parse-calendario-html"
    );
    const html = `
      <script>generateCookieConsentModal("SIGAA", "01/20/2026");</script>
      <table class="listagem">
        <tr><th>Evento</th><th>Período</th></tr>
        <tr><td>Recesso</td><td>25/06/2026 a 12/07/2026</td></tr>
      </table>
    `;

    const snapshot = parseCalendarioHtml(html, { semestreAlvo: ["2026.1"] });
    assert.equal(snapshot.eventos.length, 1);
    assert.equal(snapshot.eventos[0]?.evento, "Recesso");
  });
});

describe("B66 — persist e política", () => {
  test("não apaga eventos institucionais válidos quando snapshot indisponível", async () => {
    const { saveCalendarioEvent, getCalendarioAcademico, clearCalendarioAcademico } =
      await import("../src/lib/db/queries");
    const { persistCalendarioSnapshot } = await import(
      "../src/lib/sync/persist-calendario-snapshot"
    );

    clearCalendarioAcademico();
    saveCalendarioEvent({
      evento: "Recesso",
      data_inicio: "2026-06-25",
      data_fim: "2026-07-12",
      semestre: "2026.1",
    });

    const result = persistCalendarioSnapshot({
      scrapedAt: new Date().toISOString(),
      semestreAlvo: ["2026.1"],
      eventos: [],
      unavailable: true,
      unavailableReason: "Menu indisponível",
    });

    assert.equal(result.persisted, false);
    assert.equal(getCalendarioAcademico().length, 1);
    assert.equal(getCalendarioAcademico()[0]?.evento, "Recesso");
  });

  test("purge remove disciplinas e script do calendario_academico", async () => {
    const {
      saveCalendarioEvent,
      getCalendarioAcademico,
      clearCalendarioAcademico,
      purgeInvalidCalendarioAcademico,
    } = await import("../src/lib/db/queries");

    clearCalendarioAcademico();
    saveCalendarioEvent({
      evento: "ALGORITMOS E ESTRUTURAS DE DADOS I",
      data_inicio: "2026-02-23",
      data_fim: "2026-07-04",
      semestre: "2026.1",
    });
    saveCalendarioEvent({
      evento: "Recesso",
      data_inicio: "2026-06-25",
      data_fim: "2026-07-12",
      semestre: "2026.1",
    });
    saveCalendarioEvent({
      evento: "SIGAA window.RICH_FACES_EXTENDED_SKINNING_ON=true;",
      data_inicio: "2026-20-01",
      data_fim: null,
      semestre: "2026.1",
    });

    const removed = purgeInvalidCalendarioAcademico();
    assert.equal(removed, 2);
    assert.equal(getCalendarioAcademico().length, 1);
    assert.equal(getCalendarioAcademico()[0]?.evento, "Recesso");
  });

  test("mock snapshot persiste eventos no SQLite", async () => {
    const { clearCalendarioAcademico, getCalendarioAcademico } = await import(
      "../src/lib/db/queries"
    );
    const { buildMockCalendarioSnapshot } = await import(
      "../src/lib/scraper/calendario/mock-calendario-snapshot"
    );
    const { persistCalendarioSnapshot } = await import(
      "../src/lib/sync/persist-calendario-snapshot"
    );

    clearCalendarioAcademico();

    const snapshot = buildMockCalendarioSnapshot(new Date("2026-07-03T12:00:00"));
    const result = persistCalendarioSnapshot(snapshot);

    assert.equal(result.persisted, true);
    assert.ok(result.rowsWritten >= 3);
    assert.ok(getCalendarioAcademico().length >= 3);
  });
});

describe("B66 — navegação SIGAA", () => {
  test("bean action oficial é calendario.iniciarBusca", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const source = fs.readFileSync(
      path.join(process.cwd(), "src/lib/scraper/calendario/navigate-to-calendario.ts"),
      "utf8"
    );
    assert.match(source, /calendario\.iniciarBusca/);
  });
});

describe("B66 — agrupamento por semestre", () => {
  test("buildAcademicDateGroups só inclui semestres com eventos", async () => {
    const { buildAcademicDateGroups } = await import(
      "../src/lib/calendar/group-academic-dates"
    );

    const groups = buildAcademicDateGroups([
      {
        id: 1,
        evento: "Período Letivo",
        data_inicio: "2026-03-02",
        data_fim: "2026-07-06",
        semestre: "2026.1",
      },
      {
        id: 2,
        evento: "Rematrícula",
        data_inicio: "2026-01-29",
        data_fim: "2026-02-01",
        semestre: "2026.1",
      },
    ] as import("../src/lib/types/db").CalendarioAcademicoRow[]);

    assert.equal(groups.length, 1);
    assert.equal(groups[0]?.semestre, "2026.1");
    assert.equal(groups[0]?.items.length, 2);
    assert.equal(groups[0]?.items[0]?.label, "Período Letivo 2026.1");
    assert.equal(groups[0]?.items[0]?.date, "02/03/26 – 06/07/26");
  });

  test("buildAcademicDateDisplayGroups fixa par corrente + próximo", async () => {
    const { buildAcademicDateDisplayGroups } = await import(
      "../src/lib/calendar/group-academic-dates"
    );

    const july = new Date("2026-07-03T12:00:00");
    const rows = [
      {
        id: 1,
        evento: "Período Letivo",
        data_inicio: "2026-03-02",
        data_fim: "2026-07-06",
        semestre: "2026.1",
      },
      {
        id: 2,
        evento: "Período Letivo",
        data_inicio: "2026-08-05",
        data_fim: "2026-12-07",
        semestre: "2026.2",
      },
    ] as import("../src/lib/types/db").CalendarioAcademicoRow[];

    const groups = buildAcademicDateDisplayGroups(rows, july);

    assert.equal(groups.length, 2);
    assert.equal(groups[0]?.semestre, "2026.1");
    assert.equal(groups[0]?.items.length, 1);
    assert.equal(groups[1]?.semestre, "2026.2");
    assert.equal(groups[1]?.items.length, 1);
  });

  test("buildAcademicDateDisplayGroups troca no dia anterior ao Período Letivo", async () => {
    const { buildAcademicDateDisplayGroups } = await import(
      "../src/lib/calendar/group-academic-dates"
    );

    const eve = new Date("2026-08-04T12:00:00");
    const rows = [
      {
        id: 1,
        evento: "Período Letivo",
        data_inicio: "2026-03-02",
        data_fim: "2026-07-06",
        semestre: "2026.1",
      },
      {
        id: 2,
        evento: "Período Letivo",
        data_inicio: "2026-08-05",
        data_fim: "2026-12-07",
        semestre: "2026.2",
      },
    ] as import("../src/lib/types/db").CalendarioAcademicoRow[];

    const groups = buildAcademicDateDisplayGroups(rows, eve);

    assert.equal(groups[0]?.semestre, "2026.2");
    assert.equal(groups[0]?.items.length, 1);
    assert.equal(groups[1]?.semestre, "2027.1");
    assert.equal(groups[1]?.items.length, 0);
  });
});

describe("B66 — plano de execução", () => {
  test("dispara quando banco está vazio ou semestre diverge", async () => {
    const { shouldRunCalendarioSync } = await import(
      "../src/lib/sync/calendario-sync-plan"
    );
    const { clearCalendarioAcademico } = await import("../src/lib/db/queries");

    clearCalendarioAcademico();
    assert.equal(
      shouldRunCalendarioSync({ referenceDate: new Date("2026-07-03T12:00:00") }),
      true
    );
  });
});
