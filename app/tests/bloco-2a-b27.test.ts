/**
 * Suite B27: scraper portal do discente — parse, mock, persist, runSync.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, before, describe, test } from "node:test";

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "planner-b27-"));

process.env.DB_PATH = path.join(tmpDir, "test.db");
process.env.SIGAA_SCRAPER_MOCK = "true";

after(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

const PORTAL_FIXTURE_HTML = `
<table>
  <tr><th>Matrícula</th><td>2024001234</td></tr>
  <tr><th>Nome</th><td>João Silva</td></tr>
  <tr><th>Curso</th><td>Engenharia de Computação</td></tr>
  <tr><th>E-mail</th><td>joao@aluno.cefetmg.br</td></tr>
  <tr><th>Semestre de Ingresso</th><td>2024.1</td></tr>
  <tr><th>Situação</th><td>Regular</td></tr>
  <tr><th>RG</th><td>72,50</td></tr>
  <tr><td>Obrigatória</td><td>1200 h</td><td>3080 h</td></tr>
  <tr><td>Optativa</td><td>0 h</td><td>240 h</td></tr>
  <tr><td>AEDI</td><td>Algoritmos e Estruturas de Dados I</td><td>303/620</td><td>2M56 6M56</td></tr>
  <tr><td>LAOCI</td><td>Lab. Arq. e Org. de Comp. I</td><td>Lab 01</td><td>5M34</td></tr>
  <tr><td>Diagramas UML</td><td>ENG-SOFT</td><td>20/05/2026</td><td>individual</td></tr>
</table>
`;

describe("B27 — parse portal discente", () => {
  test("extrai aluno, CH, disciplinas e atividades do HTML", async () => {
    const { extractPortalRawFromHtml } = await import(
      "../src/lib/scraper/portal-discente/extract-portal-raw"
    );
    const { parsePortalPageData } = await import(
      "../src/lib/scraper/portal-discente/parse-portal-page"
    );

    const raw = extractPortalRawFromHtml(PORTAL_FIXTURE_HTML);
    const snapshot = parsePortalPageData(raw);

    assert.equal(snapshot.aluno.matricula, "2024001234");
    assert.equal(snapshot.aluno.nome, "João Silva");
    assert.equal(snapshot.aluno.curso, "Engenharia de Computação");
    assert.equal(snapshot.aluno.email, "joao@aluno.cefetmg.br");
    assert.equal(snapshot.aluno.semestreEntrada, "2024.1");
    assert.equal(snapshot.aluno.status, "Regular");
    assert.equal(snapshot.aluno.rg, 72.5);

    assert.ok(snapshot.integralizacao.some((item) => item.tipoCh === "Obrigatória"));
    assert.equal(snapshot.semestreAtual.length, 2);
    assert.equal(snapshot.semestreAtual[0]?.codigo, "AEDI");
    assert.equal(snapshot.semestreAtual[0]?.codigoHorario, "2M56 6M56");

    assert.equal(snapshot.atividades.length, 1);
    assert.equal(snapshot.atividades[0]?.disciplinaCodigo, "ENG-SOFT");
    assert.equal(snapshot.atividades[0]?.dataFim, "2026-05-20");
  });

  test("extrai layout real CEFET-MG (label-pairs)", async () => {
    const { parsePortalPageData } = await import(
      "../src/lib/scraper/portal-discente/parse-portal-page"
    );

    const snapshot = parsePortalPageData({
      labelPairs: {
        "Matrícula:": "20243003554",
        "Curso:": "ENGENHARIA DE COMPUTAÇÃO/DCDV - DIVINÓPOLIS",
        "Status:": "ATIVO",
        "E-Mail:": "aluno@cefetmg.br",
        "Entrada:": "2024.1",
        "RG:": "56.3333",
        "CH. Obrigatória Pendente": "2535",
        "CH. Optativa Pendente": "240",
        "ALGORITMOS E ESTRUTURAS DE DADOS I":
          "303/620 6M56 2T12 (23/02/2026 - 04/07/2026)",
        "ENGENHARIA DE SOFTWARE": "301/303 4M12 5M56 (23/02/2026 - 04/07/2026)",
        "06/07/2026 23:59 (8 dias)":
          "LABORATÓRIO DE ARQUITETURA E ORGANIZAÇÃO DE COMPUTADORES I Tarefa: MIC1 - ULA",
      },
      tableRows: [],
      plainText:
        "Meus Dados Pessoais KAIRO HENRIQUE FERREIRA MARTINS Regulamento Matrícula: 20243003554 RG: 56.3333",
    });

    assert.equal(snapshot.aluno.matricula, "20243003554");
    assert.equal(snapshot.aluno.nome, "KAIRO HENRIQUE FERREIRA MARTINS");
    assert.equal(snapshot.aluno.rg, 56.3333);
    assert.equal(snapshot.aluno.status, "ATIVO");
    assert.equal(snapshot.semestreAtual.length, 2);
    assert.equal(snapshot.integralizacao.length, 2);
    assert.equal(snapshot.integralizacao[0]?.pendente, 2535);
    assert.equal(snapshot.atividades.length, 1);
    assert.match(snapshot.atividades[0]?.titulo ?? "", /MIC1/i);
  });
});

describe("B27 — scrapePortalDiscente (mock)", () => {
  test("mock retorna snapshot completo do portal", async () => {
    const { scrapePortalDiscente } = await import(
      "../src/lib/scraper/portal-discente/scrape-portal-discente"
    );

    const snapshot = await scrapePortalDiscente({
      username: "12345678901",
      cookies: [],
      loggedInAt: new Date().toISOString(),
    });

    assert.ok(snapshot.aluno.rg);
    assert.ok(snapshot.semestreAtual.length >= 5);
    assert.ok(snapshot.integralizacao.length >= 5);
    assert.ok(snapshot.atividades.length >= 1);
  });
});

describe("B27 — persistPortalSnapshot", () => {
  before(async () => {
    const { ensureDbReady } = await import("../src/lib/db/bootstrap");
    ensureDbReady();
  });

  test("persiste aluno, integralização, semestre e tarefas", async () => {
    const { buildMockPortalSnapshot } = await import(
      "../src/lib/scraper/portal-discente/mock-portal-snapshot"
    );
    const { persistPortalSnapshot } = await import(
      "../src/lib/sync/persist-portal-snapshot"
    );
    const queries = await import("../src/lib/db/queries");

    const snapshot = buildMockPortalSnapshot("12345678901");
    persistPortalSnapshot(snapshot);

    const aluno = queries.getAluno();
    assert.ok(aluno);
    assert.equal(aluno?.matricula, "2024001234");
    assert.equal(aluno?.rg, 56.33);

    const semestre = queries.getSemestreAtual();
    assert.ok(semestre.length >= 5);

    const integralizacao = queries.getIntegralizacao();
    assert.ok(integralizacao.length >= 5);

    const tarefas = queries.getTarefas();
    assert.ok(tarefas.length >= 1);
  });

  test("não sobrescreve integralização manual no sync", async () => {
    const { buildMockPortalSnapshot } = await import(
      "../src/lib/scraper/portal-discente/mock-portal-snapshot"
    );
    const { persistPortalSnapshot } = await import(
      "../src/lib/sync/persist-portal-snapshot"
    );
    const queries = await import("../src/lib/db/queries");

    queries.insertManualIntegralizacaoHoras("Complementar", 42);
    const manualBefore = queries
      .getIntegralizacao()
      .find((row) => row.tipo_ch === "Complementar" && row.manual === 1);
    assert.ok(manualBefore);

    persistPortalSnapshot(buildMockPortalSnapshot("12345678901"));

    const manualAfter = queries
      .getIntegralizacao()
      .find((row) => row.id === manualBefore?.id);
    assert.equal(manualAfter?.concluido, 42);
    assert.equal(manualAfter?.manual, 1);
  });
});

describe("B27 — runSync integração portal", () => {
  test("runSync usa pipeline do portal em modo mock", async () => {
    const { runSync } = await import("../src/lib/sync/run-sync");
    const { getAluno, getSemestreAtual } = await import("../src/lib/db/queries");

    const result = await runSync({
      username: "12345678901",
      password: "MinhaSenha",
      savePassword: false,
    });

    assert.equal(result.steps.at(-1)?.progress, 100);
    assert.ok(getAluno());
    assert.ok(getSemestreAtual().length >= 5);
  });
});
