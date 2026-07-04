/**
 * Suite B67: turmas ofertadas — parser HTML CEFET, persist, robô isolado, API.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, before, describe, test } from "node:test";

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "planner-b67-"));

process.env.DB_PATH = path.join(tmpDir, "test.db");
process.env.SIGAA_SCRAPER_MOCK = "true";

const CEFET_SOLICITACAO_HTML = `
<html><body>
<h2>SOLICITAÇÃO DE ABERTURA DE TURMA — Período 2024.2 — Campus DIVINÓPOLIS</h2>
<h3>LISTA DE SOLICITAÇÕES</h3>
<table class="listagem">
  <thead>
    <tr>
      <th>Ano-Período</th>
      <th>Componente</th>
      <th>Tipo</th>
      <th>Situação</th>
      <th>Horário</th>
      <th>Vagas</th>
    </tr>
  </thead>
  <tbody>
    <tr><td colspan="6">DECOMDV - DEPARTAMENTO DE COMPUTAÇÃO</td></tr>
    <tr class="linhaPar">
      <td>2024-2</td>
      <td>GDSEDA2.02 - ALGORITMOS E ESTRUTURAS DE DADOS II</td>
      <td>Turma Regular</td>
      <td>Atendida</td>
      <td>4M34 2T12</td>
      <td>30</td>
    </tr>
    <tr class="linhaImpar">
      <td>2024-2</td>
      <td>GTSSI011.1 - APRENDIZADO DE MÁQUINA</td>
      <td>Turma Regular</td>
      <td>Atendida</td>
      <td>3M56</td>
      <td>25</td>
    </tr>
    <tr><td colspan="6">DFGDFV - DEPARTAMENTO DE FORMAÇÃO GERAL</td></tr>
    <tr class="linhaPar">
      <td>2024-2</td>
      <td>GDSGEN03.01 - INTRODUÇÃO A GÊNERO</td>
      <td>Turma Regular</td>
      <td>Pendente</td>
      <td></td>
      <td>0</td>
    </tr>
    <tr class="linhaImpar">
      <td>2024-2</td>
      <td>GDSXXX1.01 - DISCIPLINA CANCELADA</td>
      <td>Turma Regular</td>
      <td>Cancelada</td>
      <td>2M12</td>
      <td>10</td>
    </tr>
  </tbody>
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

describe("B67 — parser HTML CEFET", () => {
  test("extrai Atendida/Pendente, horários e ignora Cancelada", async () => {
    const { parseTurmasOfertadasHtml } = await import(
      "../src/lib/scraper/turmas-ofertadas/parse-turmas-ofertadas-html"
    );

    const snapshot = parseTurmasOfertadasHtml(CEFET_SOLICITACAO_HTML, {
      semestreAlvo: "2024.2",
    });

    assert.equal(snapshot.semestreAlvo, "2024.2");
    assert.equal(snapshot.turmas.length, 3);

    const atendida = snapshot.turmas.find(
      (item) => item.sigaaComponente === "GDSEDA2.02"
    );
    assert.ok(atendida);
    assert.equal(atendida.situacao, "atendida");
    assert.equal(atendida.horarioIndefinido, false);
    assert.equal(atendida.codigoHorario, "4M34 2T12");

    const pendente = snapshot.turmas.find(
      (item) => item.sigaaComponente === "GDSGEN03.01"
    );
    assert.ok(pendente);
    assert.equal(pendente.situacao, "pendente");
    assert.equal(pendente.horarioIndefinido, true);
    assert.equal(pendente.codigoHorario, null);
  });

  test("rejeita HTML do portal discente sem ofertas", async () => {
    const { parseTurmasOfertadasHtml } = await import(
      "../src/lib/scraper/turmas-ofertadas/parse-turmas-ofertadas-html"
    );
    const { isTurmasOfertadasPageHtml } = await import(
      "../src/lib/scraper/turmas-ofertadas/is-turmas-ofertadas-page"
    );
    const portalSnippet = `
      <h4>Turmas do Semestre</h4>
      <table>
        <tr><th>Componente Curricular</th><th>Horário</th></tr>
      </table>
      <table class="listagem">
        <thead><tr><th>Título</th><th>Autor</th></tr></thead>
      </table>
      <a>Cadastrar novo tópico para este fórum</a>
    `;

    assert.equal(isTurmasOfertadasPageHtml(portalSnippet), false);

    const snapshot = parseTurmasOfertadasHtml(portalSnippet, {
      semestreAlvo: "2026.2",
    });
    assert.equal(snapshot.unavailable, true);
    assert.equal(snapshot.turmas.length, 0);
  });
});

describe("B67 — simulador (filtro UI)", () => {
  test("oculta disciplinas concluídas e bloqueadas por pré-requisito", async () => {
    const { filterSimuladorTurmas } = await import(
      "../src/lib/simulador/turma-course-utils"
    );

    const baseCourse = {
      color: "#000",
      room: "—",
      professor: "—",
      ch: 60,
      turmaCodigo: null,
      semestre: "2026.2",
      codigoHorario: "4M34",
      vagas: 25,
      slots: [],
      situacao: "atendida" as const,
      categoria: "curso" as const,
      scheduleBlocker: false,
      scheduleWarningMessage: null,
      sigaaComponente: null,
      departamento: null,
      pendingPrereqCodes: [] as string[],
      prerequisiteHint: null,
      coRequisitoCodes: [] as string[],
      waivedCoRequisitoCodes: [] as string[],
    };

    const filtered = filterSimuladorTurmas({
      semestre: "2026.2",
      syncedAt: null,
      enrollmentContext: {
        completedDisciplinaCodes: [],
        coRequisitos: {},
        disciplinaNames: {},
      },
      empty: false,
      curso: [
        {
          ...baseCourse,
          turmaSigaaId: "a",
          code: "A",
          name: "Done",
          status: "done",
        },
        {
          ...baseCourse,
          turmaSigaaId: "b",
          code: "B",
          name: "Open",
          status: "unlocked",
        },
        {
          ...baseCourse,
          turmaSigaaId: "c",
          code: "C",
          name: "Locked",
          status: "locked",
        },
        {
          ...baseCourse,
          turmaSigaaId: "d",
          code: "D",
          name: "Maybe",
          status: "conditional",
          pendingPrereqCodes: ["02/2"],
          prerequisiteHint: "conditional",
        },
      ],
      optativas: [],
      courses: [],
    });

    assert.equal(filtered.curso.length, 2);
    assert.deepEqual(
      filtered.curso.map((item) => item.code),
      ["B", "D"]
    );
    assert.equal(filtered.hasVisibleCourses, true);
  });

  test("formata código SIGAA em horário legível", async () => {
    const { formatTurmaHorarioLegivel } = await import(
      "../src/lib/simulador/turma-course-utils"
    );

    const label = formatTurmaHorarioLegivel({
      codigoHorario: "4M34 2T12",
      slots: [],
    });

    assert.match(label ?? "", /Seg 13:50–15:30/);
    assert.match(label ?? "", /Qua 08:55–10:35/);
    assert.doesNotMatch(label ?? "", /4M34/);
  });
});

describe("B67 — persistência e API", () => {
  test("separa curso vs optativas e marca scheduleBlocker", async () => {
    const { parseTurmasOfertadasHtml } = await import(
      "../src/lib/scraper/turmas-ofertadas/parse-turmas-ofertadas-html"
    );
    const { persistTurmasOfertadasSnapshot } = await import(
      "../src/lib/sync/persist-turmas-ofertadas-snapshot"
    );
    const { buildTurmasOfertadasResponse } = await import(
      "../src/lib/turmas-ofertadas/build-turmas-ofertadas-response"
    );
    const { clearTurmasOfertadasForSemestre } = await import(
      "../src/lib/db/queries"
    );

    clearTurmasOfertadasForSemestre("2024.2");
    const snapshot = parseTurmasOfertadasHtml(CEFET_SOLICITACAO_HTML, {
      semestreAlvo: "2024.2",
    });
    persistTurmasOfertadasSnapshot(snapshot);

    const response = buildTurmasOfertadasResponse(new Date("2024-07-03T12:00:00"));
    assert.equal(response.empty, false);
    assert.ok(Array.isArray(response.enrollmentContext.completedDisciplinaCodes));
    assert.ok(typeof response.enrollmentContext.coRequisitos === "object");
    assert.ok(response.curso.length >= 1);
    assert.ok(response.optativas.length >= 1);

    const obrigatoria = response.curso.find((item) => item.code === "02/3");
    assert.ok(obrigatoria, "AES II deve ir para disciplinas do curso");

    const topico = response.optativas.find((item) =>
      /APRENDIZADO DE M/i.test(item.name)
    );
    assert.ok(topico, "tópico GT fora do núcleo obrigatório → optativas");

    const pendente = response.courses.find(
      (item) => item.situacao === "pendente"
    );
    assert.ok(pendente);
    assert.equal(pendente.scheduleBlocker, true);
    assert.match(pendente.scheduleWarningMessage ?? "", /Sem horário no SIGAA/i);
  });

  test("pendente com horário fica selecionável com aviso provisório", async () => {
    const { saveTurmaOfertada, clearTurmasOfertadasForSemestre } = await import(
      "../src/lib/db/queries"
    );
    const { buildTurmasOfertadasResponse } = await import(
      "../src/lib/turmas-ofertadas/build-turmas-ofertadas-response"
    );

    clearTurmasOfertadasForSemestre("2026.2");
    saveTurmaOfertada({
      turma_sigaa_id: "2026.2:TESTE01:pendente",
      sigaa_componente: "TESTE01",
      codigo_disciplina: "TESTE01",
      nome: "DISCIPLINA TESTE PENDENTE",
      turma_codigo: null,
      semestre: "2026.2",
      codigo_horario: "4M34 2T12",
      horario_exibicao: "4M34 2T12",
      local: null,
      professor: null,
      vagas: 20,
      vagas_ocupadas: null,
      carga_horaria: 60,
      situacao: "pendente",
      tipo_turma: "Turma Regular",
      departamento: null,
      horario_indefinido: 1,
      categoria: "curso",
      curso_id: "eng-computacao",
      synced_at: new Date().toISOString(),
    });

    const response = buildTurmasOfertadasResponse(new Date("2026-07-03T12:00:00"));
    const item = response.courses.find(
      (course) => course.sigaaComponente === "TESTE01"
    );

    assert.ok(item);
    assert.equal(item.scheduleBlocker, false);
    assert.match(item.scheduleWarningMessage ?? "", /100% definido/i);
    assert.equal(item.codigoHorario, "4M34 2T12");
  });

  test("mock persiste e respeita TTL", async () => {
    const { runTurmasOfertadasSync } = await import(
      "../src/lib/sync/run-turmas-ofertadas-sync"
    );
    const { shouldRunTurmasOfertadasSync } = await import(
      "../src/lib/sync/turmas-ofertadas-sync-plan"
    );
    const { recordTurmasOfertadasSyncedAt } = await import(
      "../src/lib/sync/sync-preferences"
    );
    const { clearTurmasOfertadasForSemestre } = await import(
      "../src/lib/db/queries"
    );
    const { resolveNextAcademicSemesterLabel } = await import(
      "../src/lib/academic/resolve-academic-semester"
    );

    const semestre = resolveNextAcademicSemesterLabel(
      new Date("2026-07-03T12:00:00")
    );
    clearTurmasOfertadasForSemestre(semestre);

    const result = await runTurmasOfertadasSync(
      { username: "00000000000", password: "mock" },
      { force: true, referenceDate: new Date("2026-07-03T12:00:00") }
    );
    assert.equal(result.ok, true);

    recordTurmasOfertadasSyncedAt(new Date().toISOString());
    assert.equal(
      shouldRunTurmasOfertadasSync({
        referenceDate: new Date("2026-07-03T12:00:00"),
      }),
      false
    );
  });
});
