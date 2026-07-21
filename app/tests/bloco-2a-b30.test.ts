/**
 * Suite B30: histórico escolar — parse PDF, persist, resiliência do sync.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, before, describe, test } from "node:test";

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "planner-b30-"));
const fixturePdf = path.join(
  process.cwd(),
  "..",
  "docs",
  "referencias",
  "historico_00000000000.pdf"
);

process.env.DB_PATH = path.join(tmpDir, "test.db");
process.env.SIGAA_SCRAPER_MOCK = "true";

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

describe("B30 — parse histórico PDF", () => {
  test("extrai disciplinas e CH do PDF de referência", async () => {
    if (!fs.existsSync(fixturePdf)) {
      console.warn("Fixture PDF ausente — pulando asserções de contagem.");
      return;
    }

    const { parseHistoricoPdfBuffer } = await import(
      "../src/lib/scraper/historico/parse-historico-pdf"
    );
    const buffer = fs.readFileSync(fixturePdf);
    const snapshot = await parseHistoricoPdfBuffer(buffer);

    assert.ok(snapshot.disciplinas.length >= 20);
    assert.ok(snapshot.chResumo.length >= 4);
    assert.equal(snapshot.chTotais?.exigido, 4320);
    assert.equal(snapshot.chTotais?.integralizado, 690);
    assert.equal(snapshot.chTotais?.pendente, 3630);

    const matr = snapshot.disciplinas.filter((entry) => entry.situacao === "MATR");
    assert.ok(matr.length >= 5);
    for (const entry of matr) {
      assert.ok(!/Dr\.|MSc\.|\(\d+h\)/i.test(entry.nome), `nome sujo: ${entry.nome}`);
    }

    const ingles = snapshot.disciplinas.find((entry) =>
      /INGL[EÊ]S INSTRUMENTAL I/i.test(entry.nome)
    );
    assert.ok(ingles);
    assert.equal(ingles?.situacao, "APR");
    assert.equal(ingles?.semestre, "2024.2");
  });
});

describe("B30 — persist histórico", () => {
  before(async () => {
    const { ensureDbReady } = await import("../src/lib/db/bootstrap");
    const { seedPpcIfEmpty } = await import("../src/lib/db/seed-ppc");
    ensureDbReady();
    seedPpcIfEmpty();
  });

  test("resolve código PPC por nome e ignora snapshot vazio", async () => {
    const { persistHistoricoSnapshot } = await import(
      "../src/lib/sync/persist-historico-snapshot"
    );
    const { getHistorico } = await import("../src/lib/db/queries");
    const { scrapeHistoricoMock } = await import(
      "../src/lib/scraper/historico/scrape-historico"
    );

    const mock = scrapeHistoricoMock();
    const result = persistHistoricoSnapshot(mock);
    assert.equal(result.persisted, true);
    assert.ok(result.rowsWritten >= 2);

    const rows = getHistorico();
    const intro = rows.find((row) => row.disciplina_id === "08/3");
    assert.ok(intro, "Introdução à Programação deve mapear para 08/3");

    const empty = persistHistoricoSnapshot({
      scrapedAt: new Date().toISOString(),
      disciplinas: [],
      chResumo: [],
    });
    assert.equal(empty.persisted, false);
    assert.ok(getHistorico().length >= 2, "histórico anterior preservado");
  });

  test("persiste MATR como cursando e CH do PDF na integralização", async () => {
    if (!fs.existsSync(fixturePdf)) return;

    const { parseHistoricoPdfBuffer } = await import(
      "../src/lib/scraper/historico/parse-historico-pdf"
    );
    const { persistHistoricoSnapshot } = await import(
      "../src/lib/sync/persist-historico-snapshot"
    );
    const { getHistorico, getIntegralizacao, getConfig } = await import(
      "../src/lib/db/queries"
    );
    const { buildIntegralizacao } = await import(
      "../src/lib/integralizacao/build-integralizacao"
    );
    const { persistPortalSnapshot } = await import(
      "../src/lib/sync/persist-portal-snapshot"
    );
    const { buildMockPortalSnapshot } = await import(
      "../src/lib/scraper/portal-discente/mock-portal-snapshot"
    );

    await persistPortalSnapshot(buildMockPortalSnapshot("12345678901"));

    const snapshot = await parseHistoricoPdfBuffer(fs.readFileSync(fixturePdf));
    const result = persistHistoricoSnapshot(snapshot);
    assert.equal(result.persisted, true);
    assert.ok(result.rowsWritten >= 25);

    const cursando = getHistorico().filter((row) => row.status === "cursando");
    assert.ok(cursando.length >= 5, "MATR deve virar cursando no historico");

    const obrigatoria = getIntegralizacao().find(
      (row) => row.tipo_ch === "Obrigatória" && row.manual === 0
    );
    assert.equal(obrigatoria?.concluido, 570);
    assert.equal(obrigatoria?.pendente, 2535);
    assert.equal(obrigatoria?.total_necessario, 3105);

    assert.equal(getConfig("sigaa.ch.total_curriculo"), "4320");

    const integralizacao = buildIntegralizacao();
    assert.equal(integralizacao.totalHours, 4320);
    assert.equal(integralizacao.totalDone, 690);
    assert.equal(integralizacao.percent, 16);

    const { resolveDisciplinaCodigoByNome } = await import(
      "../src/lib/scraper/portal-discente/resolve-disciplina-codigo"
    );
    assert.equal(resolveDisciplinaCodigoByNome("INTRODUÇÃO À SOCIOLOGIA"), "04/7");
    assert.equal(resolveDisciplinaCodigoByNome("ENGENHARIA DE SOFTWARE"), "06/3");
    assert.equal(
      resolveDisciplinaCodigoByNome("EMPREENDEDORISMO E PLANO DE NEGÓCIOS"),
      "05/7"
    );
    assert.equal(
      resolveDisciplinaCodigoByNome("ALGORITMOS E ESTRUTURAS DE DADOS I"),
      "01/3"
    );
  });
});

describe("B30 — resiliência do sync", () => {
  before(async () => {
    const { ensureDbReady } = await import("../src/lib/db/bootstrap");
    const { seedPpcIfEmpty } = await import("../src/lib/db/seed-ppc");
    ensureDbReady();
    seedPpcIfEmpty();

    const { persistPortalSnapshot } = await import(
      "../src/lib/sync/persist-portal-snapshot"
    );
    const { buildMockPortalSnapshot } = await import(
      "../src/lib/scraper/portal-discente/mock-portal-snapshot"
    );
    const { scrapeTurmaVirtualMock } = await import(
      "../src/lib/scraper/turma-virtual/scrape-turma-virtual"
    );
    const { persistTurmaVirtualSnapshot } = await import(
      "../src/lib/sync/persist-turma-virtual-snapshot"
    );

    await persistPortalSnapshot(buildMockPortalSnapshot("12345678901"));
    persistTurmaVirtualSnapshot(scrapeTurmaVirtualMock());
  });

  test("falha no histórico não apaga dados da turma", async () => {
    const { getSemestreAtual, getHistorico, getNotasByDisciplina } =
      await import("../src/lib/db/queries");
    const { persistHistoricoSnapshot } = await import(
      "../src/lib/sync/persist-historico-snapshot"
    );
    const { scrapeHistoricoMock } = await import(
      "../src/lib/scraper/historico/scrape-historico"
    );

    persistHistoricoSnapshot(scrapeHistoricoMock());

    const semestreBefore = getSemestreAtual().length;
    const notasBefore = getNotasByDisciplina("06/3").length;
    assert.ok(semestreBefore > 0);
    assert.ok(notasBefore > 0);

    persistHistoricoSnapshot({
      scrapedAt: new Date().toISOString(),
      disciplinas: [],
      chResumo: [],
    });

    assert.equal(getSemestreAtual().length, semestreBefore);
    assert.equal(getNotasByDisciplina("06/3").length, notasBefore);
    assert.ok(getHistorico().length >= 2);
  });
});
