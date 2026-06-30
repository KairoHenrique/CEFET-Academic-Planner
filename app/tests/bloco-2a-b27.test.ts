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
  <tr><td>CH. Obrigatória Pendente</td><td>1880</td></tr>
  <tr><td>CH. Optativa Pendente</td><td>240</td></tr>
  <tr><td>AEDI</td><td>Algoritmos e Estruturas de Dados I</td><td>303/620</td><td>2M56 6M56</td></tr>
  <tr><td>LAOCI</td><td>Lab. Arq. e Org. de Comp. I</td><td>Lab 01</td><td>5M34</td></tr>
  <tr><td>20/05/2026 23:59 (5 dias)</td><td>ENGENHARIA DE SOFTWARE Tarefa: Diagramas UML</td></tr>
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
    assert.ok(snapshot.semestreAtual.length >= 2);
    assert.ok(
      snapshot.semestreAtual.some((row) =>
        /algoritmos|aedi/i.test(`${row.codigo} ${row.nome}`)
      )
    );

    assert.equal(snapshot.atividades.length, 1);
    assert.equal(snapshot.atividades[0]?.disciplinaCodigo, "ENGENHARIA DE SOFTWARE");
    assert.equal(snapshot.atividades[0]?.titulo, "Diagramas UML");
    assert.equal(snapshot.atividades[0]?.dataFim, "2026-05-20");
  });

  test("ignora notícias e atualizações do portal", async () => {
    const { parsePortalPageData } = await import(
      "../src/lib/scraper/portal-discente/parse-portal-page"
    );

    const snapshot = parsePortalPageData({
      labelPairs: {
        "23/06/2026":
          "EMPREENDEDORISMO E PLANO DE NEGÓCIOS (2026.1) Indicação de Site: Nascente Incubadora",
        "25/06/2026 - ENGENHARIA DE SOFTWARE (2026.1) Nova Notícia: VEM AÍ! CONECT.AI":
          "25/06/2026 - ENGENHARIA DE SOFTWARE (2026.1) Nova Notícia: VEM AÍ! CONECT.AI STARTUP",
        "08/07/2026 23:59 (8 dias)":
          "LABORATÓRIO DE ARQUITETURA E ORGANIZAÇÃO DE COMPUTADORES I Tarefa: MIC1 - ULA",
      },
      tableRows: [],
      plainText: "Últimas Atualizações Minhas Atividades",
    });

    assert.equal(snapshot.atividades.length, 1);
    assert.match(snapshot.atividades[0]?.titulo ?? "", /MIC1/i);
  });

  test("extrai atividades da tabela Minhas atividades (formAtividades)", async () => {
    const { parsePortalAtividadesFromHtml } = await import(
      "../src/lib/scraper/portal-discente/parse-portal-atividades"
    );

    const FIXTURE = `
      <form id="formAtividades">
        <table>
          <tr class="odd">
            <td></td>
            <td>06/07/2026 23:59 (7 dias)</td>
            <td>
              <small>
                LABORATÓRIO DE ARQUITETURA E ORGANIZAÇÃO DE COMPUTADORES I<br>
                <strong>Tarefa:</strong>
                <a id="formAtividades:visualizarTarefaTurmaVirtual" href="#">MIC1 - ULA</a>
              </small>
            </td>
          </tr>
        </table>
      </form>
    `;

    const atividades = parsePortalAtividadesFromHtml(FIXTURE);
    assert.equal(atividades.length, 1);
    assert.equal(atividades[0]?.titulo, "MIC1 - ULA");
    assert.equal(atividades[0]?.dataFim, "2026-07-06");
    assert.equal(
      atividades[0]?.disciplinaCodigo,
      "LABORATÓRIO DE ARQUITETURA E ORGANIZAÇÃO DE COMPUTADORES I"
    );
  });

  test("resolve teoria e laboratório sem fundir disciplinas", async () => {
    const { scoreDisciplinaNomeMatch } = await import(
      "../src/lib/scraper/portal-discente/resolve-disciplina-codigo"
    );

    const cases = [
      ["eletronica", "laboratorio de eletronica", -1],
      ["eletronica", "eletronica", 1000],
      ["algoritmos e estruturas de dados i", "laboratorio de algoritmos e estruturas de dados i", -1],
      ["fisica", "fisica", 1000],
      ["fisica i", "fisica", 400],
    ] as const;

    for (const [target, candidate, expected] of cases) {
      const score = scoreDisciplinaNomeMatch(target, candidate);
      if (expected < 0) {
        assert.ok(score < 0, `${target} vs ${candidate} deveria rejeitar`);
      } else {
        assert.ok(score >= expected, `${target} vs ${candidate} score=${score}`);
      }
    }
  });

  test("extrai qualquer disciplina do quadro de horários (nomes curtos)", async () => {
    const { parseDisciplinasHorarioFromHtml } = await import(
      "../src/lib/scraper/portal-discente/parse-portal-horario"
    );

    const FIXTURE = `
      <table>
        <thead><tr><th>Componente Curricular</th><th>Local</th><th>Horário</th></tr></thead>
        <tbody>
      <tr><td class="descricao">
        <form id="form_acessarTurmaVirtual">
          <a href="#" onclick="frontEndIdTurma">FÍSICA</a>
        </form>
      </td><td class="info">101</td><td class="info">2M12 (23/02/2026 - 04/07/2026)</td></tr>
      <tr><td class="descricao">
        <form id="form_acessarTurmaVirtualj_id_1">
          <a href="#" onclick="frontEndIdTurma">CÁLCULO I</a>
        </form>
      </td><td class="info">202</td><td class="info">4T34 (23/02/2026 - 04/07/2026)</td></tr>
        </tbody>
      </table>
    `;

    const list = parseDisciplinasHorarioFromHtml(FIXTURE);
    assert.equal(list.length, 2);
    assert.ok(list.some((item) => item.nome === "FÍSICA"));
    assert.ok(list.some((item) => item.nome === "CÁLCULO I"));
  });

  test("resolve teoria e laboratório sem fundir disciplinas (semestre)", async () => {
    const { ensureDbReady } = await import("../src/lib/db/bootstrap");
    ensureDbReady();

    const {
      normalizeDisciplinaNome,
      resolveDisciplinaCodigoFromSemestre,
    } = await import(
      "../src/lib/scraper/portal-discente/resolve-disciplina-codigo"
    );

    const semestreByNome = new Map(
      [
        "ALGORITMOS E ESTRUTURAS DE DADOS I",
        "LABORATÓRIO DE ALGORITMOS E ESTRUTURAS DE DADOS I",
        "ELETRÔNICA",
        "LABORATÓRIO DE ELETRÔNICA",
        "ESTATÍSTICA",
      ].map((nome) => [normalizeDisciplinaNome(nome), nome])
    );

    const activeIds = new Set(semestreByNome.values());

    assert.equal(
      resolveDisciplinaCodigoFromSemestre(
        "ALGORITMOS E ESTRUTURAS DE DADOS I",
        semestreByNome,
        activeIds
      ),
      "ALGORITMOS E ESTRUTURAS DE DADOS I"
    );
    assert.equal(
      resolveDisciplinaCodigoFromSemestre(
        "LABORATÓRIO DE ALGORITMOS E ESTRUTURAS DE DADOS I",
        semestreByNome,
        activeIds
      ),
      "LABORATÓRIO DE ALGORITMOS E ESTRUTURAS DE DADOS I"
    );
    assert.equal(
      resolveDisciplinaCodigoFromSemestre("ELETRÔNICA", semestreByNome, activeIds),
      "ELETRÔNICA"
    );
    assert.equal(
      resolveDisciplinaCodigoFromSemestre(
        "LABORATÓRIO DE ELETRÔNICA",
        semestreByNome,
        activeIds
      ),
      "LABORATÓRIO DE ELETRÔNICA"
    );
  });

  test("extrai layout real CEFET-MG (label-pairs)", async () => {
    const { parsePortalPageData } = await import(
      "../src/lib/scraper/portal-discente/parse-portal-page"
    );

    const snapshot = parsePortalPageData({
      labelPairs: {
        "Matrícula:": "00000000000",
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
        "Meus Dados Pessoais KAIRO HENRIQUE FERREIRA MARTINS Regulamento Matrícula: 00000000000 RG: 56.3333",
    });

    assert.equal(snapshot.aluno.matricula, "00000000000");
    assert.equal(snapshot.aluno.nome, "KAIRO HENRIQUE FERREIRA MARTINS");
    assert.equal(snapshot.aluno.rg, 56.3333);
    assert.equal(snapshot.aluno.status, "ATIVO");
    assert.equal(snapshot.semestreAtual.length, 2);
    assert.equal(snapshot.integralizacao.length, 2);
    assert.equal(snapshot.integralizacao[0]?.pendente, 2535);
    assert.equal(snapshot.integralizacao[0]?.concluido, 545);
    assert.equal(snapshot.integralizacao[0]?.totalNecessario, 3080);
    assert.equal(snapshot.atividades.length, 1);
    assert.match(snapshot.atividades[0]?.titulo ?? "", /MIC1/i);
  });

  test("extrai CH do layout agregado CEFET (linha Integralizações)", async () => {
    const { parsePortalPageData } = await import(
      "../src/lib/scraper/portal-discente/parse-portal-page"
    );

    const snapshot = parsePortalPageData({
      labelPairs: {},
      tableRows: [
        [
          "Integralizações: CH. Obrigatória Pendente 2535 CH. Optativa Pendente 240",
          "CH. Obrigatória Pendente",
          "2535",
          "CH. Optativa Pendente",
          "240",
          "CH. Complementar Pendente",
          "375",
          "CH. Extensão Pendente",
          "450",
          "CH. Flexibilizada Pendente",
          "30",
          "16% Integralizado",
        ],
        ["CH. Obrigatória Pendente", "2535"],
      ],
      plainText: "Integralizações CH. Obrigatória Pendente 2535 16% Integralizado",
    });

    const obrigatoria = snapshot.integralizacao.find((item) => item.tipoCh === "Obrigatória");
    assert.ok(obrigatoria);
    assert.equal(obrigatoria?.pendente, 2535);
    assert.equal(obrigatoria?.concluido, 545);
    assert.equal(obrigatoria?.totalNecessario, 3080);
    assert.equal(snapshot.integralizacao.length, 5);
  });

  test("extrai CH. Total Currículo e percentual integralizado", async () => {
    const { parsePortalPageData } = await import(
      "../src/lib/scraper/portal-discente/parse-portal-page"
    );

    const snapshot = parsePortalPageData({
      labelPairs: {
        "CH. Total Currículo": "4510",
        "CH. Obrigatória Pendente": "2535",
      },
      tableRows: [["16% Integralizado"]],
      plainText: "Integralizações CH. Total Currículo 4510 10% Integralizado",
    });

    assert.equal(snapshot.integralizacaoResumo.totalCurriculo, 4510);
    assert.equal(snapshot.integralizacaoResumo.percentIntegralizado, 10);
  });
});

describe("B27 — scrapePortalDiscente (mock)", () => {
  test("mock retorna snapshot completo do portal", async () => {
    const { scrapePortalDiscenteMock } = await import(
      "../src/lib/scraper/portal-discente/scrape-portal-discente"
    );

    const snapshot = scrapePortalDiscenteMock("12345678901");

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

  test("troca de matrícula remove disciplinas do aluno anterior", async () => {
    const { buildMockPortalSnapshot } = await import(
      "../src/lib/scraper/portal-discente/mock-portal-snapshot"
    );
    const { persistPortalSnapshot } = await import(
      "../src/lib/sync/persist-portal-snapshot"
    );
    const queries = await import("../src/lib/db/queries");

    persistPortalSnapshot(buildMockPortalSnapshot("aluno-a"));
    assert.ok(
      queries.getSemestreAtual().some((row) => row.disciplina_id === "LAOCI")
    );

    const outroAluno = buildMockPortalSnapshot("aluno-b");
    outroAluno.aluno.matricula = "99988877766";
    outroAluno.semestreAtual = outroAluno.semestreAtual.filter(
      (disciplina) => disciplina.codigo === "AEDI"
    );
    persistPortalSnapshot(outroAluno);

    const semestre = queries.getSemestreAtual();
    assert.equal(semestre.length, 1);
    assert.equal(semestre[0]?.disciplina_id, "AEDI");
  });

  test("não persiste tarefas com prazo vencido", async () => {
    const { buildMockPortalSnapshot } = await import(
      "../src/lib/scraper/portal-discente/mock-portal-snapshot"
    );
    const { persistPortalSnapshot } = await import(
      "../src/lib/sync/persist-portal-snapshot"
    );
    const queries = await import("../src/lib/db/queries");

    const snapshot = buildMockPortalSnapshot("12345678901");
    snapshot.atividades = [
      {
        disciplinaCodigo: "AEDI",
        titulo: "Tarefa antiga",
        dataFim: "2020-01-01",
        horaFim: "23:59",
        tipo: "individual",
        descricao: null,
      },
      {
        disciplinaCodigo: "AEDI",
        titulo: "Tarefa futura",
        dataFim: "2099-12-31",
        horaFim: "23:59",
        tipo: "individual",
        descricao: null,
      },
    ];

    persistPortalSnapshot(snapshot);

    const titulos = queries.getTarefas().map((row) => row.titulo);
    assert.ok(!titulos.some((titulo) => titulo.includes("antiga")));
    assert.ok(titulos.some((titulo) => titulo.includes("futura")));
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
