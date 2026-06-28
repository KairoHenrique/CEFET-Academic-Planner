/**
 * Suite B28: scraper turma virtual — parse, mock, persist, runSync.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, before, describe, test } from "node:test";

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "planner-b28-"));

process.env.DB_PATH = path.join(tmpDir, "test.db");
process.env.SIGAA_SCRAPER_MOCK = "true";

after(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

const NOTAS_FIXTURE = `
<table>
  <tr>
    <th title="Avaliação: Prova 1 | Nota Máxima: 30.0">PRO1</th>
    <th title="Avaliação: Seminário | Nota Máxima: 10.0">SEM</th>
    <th title="Avaliação: Prova 2 | Nota Máxima: 30.0">PRO2</th>
    <th title="Avaliação: Nota | Nota Máxima: 30.0">Nota</th>
    <th>Resultado</th>
    <th>Faltas</th>
    <th>Situação</th>
  </tr>
  <tr>
    <td>9,0</td>
    <td>5,8</td>
    <td>10,0</td>
    <td>-</td>
    <td>24,8</td>
    <td>8</td>
    <td>-</td>
  </tr>
</table>
`;

const FREQUENCIA_FIXTURE = `
<table>
  <tr><th>Data</th><th>Frequência</th></tr>
  <tr><td>10/02/2026</td><td>Presente</td></tr>
  <tr><td>12/02/2026</td><td>Faltou</td></tr>
  <tr><td>28/05/2026</td><td>Não registrado</td></tr>
</table>
`;

const GRUPO_FIXTURE = `
<table>
  <tr><th>Nome</th><th>Matrícula</th><th>E-mail</th><th>Curso</th></tr>
  <tr><td>Kairo Henrique</td><td>2024001234</td><td>kairo@aluno.cefetmg.br</td><td>Eng. Computação</td></tr>
  <tr><td>Maria Silva</td><td>2024005678</td><td>maria@aluno.cefetmg.br</td><td>Eng. Computação</td></tr>
</table>
`;

const TAREFAS_FIXTURE = `
<table>
  <tr><th>Título</th><th>Período</th><th>Possui Nota</th><th>Tipo</th></tr>
  <tr>
    <td><a href="/detalhe">Diagramas UML</a></td>
    <td>15/05/2026 - 20/05/2026 23:59</td>
    <td>Sim (10,0)</td>
    <td>Individual</td>
  </tr>
</table>
`;

const TAREFA_DETALHE_FIXTURE = `
<div>Descrição: Elaborar diagramas UML completos do sistema.</div>
<h3>Instruções</h3>
<ul><li>Modelar casos de uso</li><li>Exportar em PDF</li></ul>
<h3>Entregáveis</h3>
<ul><li>Arquivo PDF</li></ul>
<a href="/material/diagramas.pdf">diagramas.pdf</a>
`;

describe("B28 — parse turma virtual", () => {
  test("extrai notas com tooltip e limite de faltas", async () => {
    const { parseNotasPageHtml } = await import(
      "../src/lib/scraper/turma-virtual/parse-notas-page"
    );
    const result = parseNotasPageHtml(NOTAS_FIXTURE);

    assert.equal(result.notas.length, 4);
    assert.equal(result.notas[0]?.avaliacaoNome, "Prova 1");
    assert.equal(result.notas[0]?.notaMaxima, 30);
    assert.equal(result.notas[0]?.notaObtida, 9);
    assert.equal(result.maxFaltas, 8);
  });

  test("extrai notas do layout Alunos Matriculados (CEFET live)", async () => {
    const { parseNotasPageHtml } = await import(
      "../src/lib/scraper/turma-virtual/parse-notas-page"
    );
    const SIGAA_NOTAS_FIXTURE = `
      <table>
        <tr><th>Matrícula</th><th>Nome</th><th>Unid. 1</th><th>Faltas</th></tr>
        <tr><td></td><td></td><td>PRO1</td><td>SEM</td><td>PRO2</td><td>Nota</td></tr>
        <tr><td>20243003554</td><td>Kairo</td><td>15,8</td><td>9,0</td><td></td><td></td><td>0</td></tr>
      </table>
    `;
    const result = parseNotasPageHtml(SIGAA_NOTAS_FIXTURE);
    assert.equal(result.notas.length, 4);
    assert.equal(result.notas[0]?.notaObtida, 15.8);
    assert.equal(result.notas[1]?.notaObtida, 9);
  });

  test("extrai frequência por data", async () => {
    const { parseFrequenciaPageHtml } = await import(
      "../src/lib/scraper/turma-virtual/parse-frequencia-page"
    );
    const faltas = parseFrequenciaPageHtml(FREQUENCIA_FIXTURE);

    assert.equal(faltas.length, 3);
    assert.equal(faltas[0]?.status, "presente");
    assert.equal(faltas[1]?.status, "falta");
    assert.equal(faltas[2]?.status, "nao_registrada");
  });

  test("extrai membros do grupo", async () => {
    const { parseGrupoPageHtml } = await import(
      "../src/lib/scraper/turma-virtual/parse-grupo-page"
    );
    const grupo = parseGrupoPageHtml(GRUPO_FIXTURE);

    assert.equal(grupo.length, 2);
    assert.equal(grupo[0]?.matricula, "2024001234");
    assert.equal(grupo[1]?.email, "maria@aluno.cefetmg.br");
  });

  test("extrai tarefas com detalhe, instruções e entregáveis", async () => {
    const { parseTarefasListPageHtml } = await import(
      "../src/lib/scraper/turma-virtual/parse-tarefas-page"
    );
    const tarefas = parseTarefasListPageHtml(TAREFAS_FIXTURE, {
      "Diagramas UML": TAREFA_DETALHE_FIXTURE,
    });

    assert.equal(tarefas.length, 1);
    assert.equal(tarefas[0]?.titulo, "Diagramas UML");
    assert.equal(tarefas[0]?.dataFim, "2026-05-20");
    assert.equal(tarefas[0]?.possuiNota, true);
    assert.equal(tarefas[0]?.pontuacaoMaxima, 10);
    assert.equal(tarefas[0]?.instrucoes.length, 2);
    assert.equal(tarefas[0]?.entregaveis.length, 1);
  });

  test("monta snapshot de disciplina a partir das subpáginas", async () => {
    const { parseTurmaDisciplinaPages } = await import(
      "../src/lib/scraper/turma-virtual/parse-turma-disciplina"
    );

    const disciplina = parseTurmaDisciplinaPages({
      sigaaNome: "Engenharia de Software",
      sigaaUrl: "https://sig.cefetmg.br/mock",
      notasHtml: NOTAS_FIXTURE,
      frequenciaHtml: FREQUENCIA_FIXTURE,
      grupoHtml: GRUPO_FIXTURE,
      tarefasHtml: TAREFAS_FIXTURE,
      tarefaDetalhesHtml: { "Diagramas UML": TAREFA_DETALHE_FIXTURE },
    });

    assert.equal(disciplina.notas.length, 4);
    assert.equal(disciplina.faltas.length, 3);
    assert.equal(disciplina.grupo.length, 2);
    assert.equal(disciplina.tarefas.length, 1);
    assert.equal(disciplina.scrapeWarnings.length, 0);
  });
});

describe("B28 — scrapeTurmaVirtual (mock)", () => {
  test("mock retorna snapshot completo da turma virtual", async () => {
    const { scrapeTurmaVirtual } = await import(
      "../src/lib/scraper/turma-virtual/scrape-turma-virtual"
    );

    const snapshot = await scrapeTurmaVirtual({
      username: "12345678901",
      cookies: [],
    });

    assert.ok(snapshot.disciplinas.length >= 5);
    const engSoft = snapshot.disciplinas.find((item) =>
      item.sigaaNome.includes("Engenharia de Software")
    );
    assert.ok(engSoft);
    assert.ok(engSoft.notas.length >= 3);
    assert.ok(engSoft.tarefas.some((task) => task.titulo === "Diagramas UML"));
  });
});

describe("B28 — persistTurmaVirtualSnapshot", () => {
  before(async () => {
    const { ensureDbReady } = await import("../src/lib/db/bootstrap");
    ensureDbReady();

    const { persistPortalSnapshot } = await import(
      "../src/lib/sync/persist-portal-snapshot"
    );
    const { buildMockPortalSnapshot } = await import(
      "../src/lib/scraper/portal-discente/mock-portal-snapshot"
    );

    persistPortalSnapshot(buildMockPortalSnapshot("12345678901"));
  });

  test("persiste notas, faltas, grupo e tarefas enriquecidas", async () => {
    const { scrapeTurmaVirtual } = await import(
      "../src/lib/scraper/turma-virtual/scrape-turma-virtual"
    );
    const { persistTurmaVirtualSnapshot } = await import(
      "../src/lib/sync/persist-turma-virtual-snapshot"
    );
    const {
      getNotasByDisciplina,
      getFaltasByDisciplina,
      getGrupoByDisciplina,
      getTarefasByDisciplina,
      getSemestreAtualByCodigo,
    } = await import("../src/lib/db/queries");

    const snapshot = await scrapeTurmaVirtual({
      username: "12345678901",
      cookies: [],
    });
    persistTurmaVirtualSnapshot(snapshot);

    const notas = getNotasByDisciplina("ENG-SOFT");
    assert.ok(notas.some((nota) => nota.avaliacao_nome === "PRO1"));

    const faltas = getFaltasByDisciplina("ENG-SOFT");
    assert.ok(faltas.length >= 8);

    const grupo = getGrupoByDisciplina("ENG-SOFT");
    assert.equal(grupo.length, 2);

    const tarefas = getTarefasByDisciplina("LAOCI");
    const mic1 = tarefas.find((task) => task.titulo.includes("MIC1"));
    assert.ok(mic1?.descricao?.includes("ULA"));
    assert.ok(mic1?.instrucoes?.includes("["));
    assert.ok(mic1?.pontuacao_maxima === 10);

    const semestre = getSemestreAtualByCodigo("ENG-SOFT");
    assert.ok(semestre?.professor);
    assert.equal(semestre?.max_faltas, 15);
  });

  test("não sobrescreve nota manual do usuário", async () => {
    const { scrapeTurmaVirtual } = await import(
      "../src/lib/scraper/turma-virtual/scrape-turma-virtual"
    );
    const { persistTurmaVirtualSnapshot } = await import(
      "../src/lib/sync/persist-turma-virtual-snapshot"
    );
    const { upsertSyncedNota, getNotasByDisciplina } = await import(
      "../src/lib/db/queries"
    );

    upsertSyncedNota({
      disciplina_id: "LAOCI",
      avaliacao_nome: "PRO1",
      nota_maxima: 10,
      nota_obtida: 7.5,
      manual: 1,
    });

    const snapshot = await scrapeTurmaVirtual({
      username: "12345678901",
      cookies: [],
    });
    persistTurmaVirtualSnapshot(snapshot);

    const nota = getNotasByDisciplina("LAOCI").find(
      (item) => item.avaliacao_nome === "PRO1"
    );
    assert.equal(nota?.nota_obtida, 7.5);
    assert.equal(nota?.manual, 1);
  });
});

describe("B28 — runSync integração turma virtual", () => {
  before(async () => {
    const { ensureDbReady } = await import("../src/lib/db/bootstrap");
    ensureDbReady();
  });

  test("runSync persiste portal e turma virtual em modo mock", async () => {
    const { runSync } = await import("../src/lib/sync/run-sync");
    const { getNotasByDisciplina, getGrupoByDisciplina } = await import(
      "../src/lib/db/queries"
    );

    await runSync({
      username: "12345678901",
      password: "mock",
      savePassword: false,
    });

    assert.ok(getNotasByDisciplina("ENG-SOFT").length > 0);
    assert.ok(getGrupoByDisciplina("ENG-SOFT").length > 0);
  });
});
