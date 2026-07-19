/**
 * Suite B31: pipeline resiliente, readiness e modos full/incremental.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, before, describe, test } from "node:test";

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "planner-b31-"));
process.env.DB_PATH = path.join(tmpDir, "test.db");
process.env.SIGAA_SCRAPER_MOCK = "true";

before(async () => {
  const { ensureDbReady, resetDbBootstrapForTests } = await import(
    "../src/lib/db/bootstrap"
  );
  const { runWithUserDb } = await import("../src/lib/db/connection-manager");
  const { seedPpcIfEmpty } = await import("../src/lib/db/seed-ppc");
  resetDbBootstrapForTests();
  runWithUserDb("12345678901", () => {
    ensureDbReady();
    seedPpcIfEmpty();
  });
});

after(() => {
  try {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  } catch {
    // Windows pode manter lock no SQLite temporário
  }
});

describe("B31 — sync readiness", () => {
  test("sem dados locais exige sync completo no login", async () => {
    const { evaluateSyncReadiness } = await import(
      "../src/lib/sync/sync-readiness"
    );
    const result = evaluateSyncReadiness("aluno@teste");
    assert.equal(result.canFastLogin, false);
    assert.equal(result.reason, "no_data");
  });

  test("com dados e mesmo usuário permite login rápido", async () => {
    const { runWithUserDb } = await import("../src/lib/db/connection-manager");
    const { ensureDbReady } = await import("../src/lib/db/bootstrap");
    const { persistPortalSnapshot } = await import(
      "../src/lib/sync/persist-portal-snapshot"
    );
    const { buildMockPortalSnapshot } = await import(
      "../src/lib/scraper/portal-discente/mock-portal-snapshot"
    );
    const {
      recordSyncCompletedAt,
      recordSyncedUsername,
    } = await import("../src/lib/sync/sync-preferences");
    const { evaluateSyncReadiness } = await import(
      "../src/lib/sync/sync-readiness"
    );

    await runWithUserDb("12345678901", async () => {
      ensureDbReady();
      await persistPortalSnapshot(buildMockPortalSnapshot("12345678901"));
      recordSyncCompletedAt();
      recordSyncedUsername("12345678901");

      const result = evaluateSyncReadiness("12345678901");
      assert.equal(result.canFastLogin, true);
      assert.equal(result.reason, "ready");
    });
  });

  test("só last_sync sem semestre/histórico exige sync full", async () => {
    const { runWithUserDb } = await import("../src/lib/db/connection-manager");
    const { ensureDbReady } = await import("../src/lib/db/bootstrap");
    const { getActiveDatabase } = await import("../src/lib/db/connection-manager");
    const { saveAluno } = await import("../src/lib/db/queries");
    const {
      recordSyncCompletedAt,
      recordSyncedUsername,
    } = await import("../src/lib/sync/sync-preferences");
    const { evaluateSyncReadiness } = await import(
      "../src/lib/sync/sync-readiness"
    );

    runWithUserDb("55555555555", () => {
      ensureDbReady();
      getActiveDatabase().exec(
        "DELETE FROM historico; DELETE FROM semestre_atual;"
      );
      saveAluno({
        matricula: "2024000001",
        nome: "Sem Sync",
        curso: "Engenharia de Computação",
        email: null,
        semestre_entrada: "2024.1",
        rg: 10,
        status: "Regular",
      });
      recordSyncCompletedAt();
      recordSyncedUsername("55555555555");

      const result = evaluateSyncReadiness("55555555555");
      assert.equal(result.canFastLogin, false);
      assert.equal(result.reason, "no_data");
    });
  });

  test("outro CPF sem snapshot local exige sync completo", async () => {
    const { runWithUserDb } = await import("../src/lib/db/connection-manager");
    const { ensureDbReady } = await import("../src/lib/db/bootstrap");
    const { evaluateSyncReadiness } = await import(
      "../src/lib/sync/sync-readiness"
    );

    runWithUserDb("98765432100", () => {
      ensureDbReady();
      const result = evaluateSyncReadiness("98765432100");
      assert.equal(result.canFastLogin, false);
      assert.equal(result.reason, "no_data");
    });
  });
});

describe("B31 — snapshot policies", () => {
  test("portal sem matrícula não é persistível", async () => {
    const { isPortalSnapshotPersistable } = await import(
      "../src/lib/sync/portal-snapshot-policy"
    );
    const { buildMockPortalSnapshot } = await import(
      "../src/lib/scraper/portal-discente/mock-portal-snapshot"
    );

    const snapshot = buildMockPortalSnapshot("12345678901");
    snapshot.aluno.matricula = "";
    snapshot.semestreAtual = [];
    assert.equal(isPortalSnapshotPersistable(snapshot), false);
  });

  test("portal com matrícula e zero turmas é persistível (semestre vazio)", async () => {
    const { isPortalSnapshotPersistable, isPortalSemesterEmpty } = await import(
      "../src/lib/sync/portal-snapshot-policy"
    );
    const { buildMockPortalSnapshot } = await import(
      "../src/lib/scraper/portal-discente/mock-portal-snapshot"
    );

    const snapshot = buildMockPortalSnapshot("12345678901");
    snapshot.semestreAtual = [];
    assert.equal(isPortalSnapshotPersistable(snapshot), true);
    assert.equal(isPortalSemesterEmpty(snapshot), true);
  });

  test("turma vazia não é persistível", async () => {
    const { isTurmaSnapshotPersistable } = await import(
      "../src/lib/sync/turma-snapshot-policy"
    );

    assert.equal(
      isTurmaSnapshotPersistable({ scrapedAt: new Date().toISOString(), disciplinas: [] }),
      false
    );
  });

  test("persist portal vazio limpa semestre anterior", async () => {
    const { runWithUserDb } = await import("../src/lib/db/connection-manager");
    const { ensureDbReady } = await import("../src/lib/db/bootstrap");
    const { persistPortalSnapshot } = await import(
      "../src/lib/sync/persist-portal-snapshot"
    );
    const { buildMockPortalSnapshot } = await import(
      "../src/lib/scraper/portal-discente/mock-portal-snapshot"
    );
    const { getSemestreAtual } = await import("../src/lib/db/queries");

    await runWithUserDb("12345678901", async () => {
      ensureDbReady();
      await persistPortalSnapshot(buildMockPortalSnapshot("12345678901"));
      const before = getSemestreAtual().length;
      assert.ok(before > 0);

      const empty = buildMockPortalSnapshot("12345678901");
      empty.semestreAtual = [];
      const result = await persistPortalSnapshot(empty);
      assert.equal(result.persisted, true);
      assert.equal(result.emptySemester, true);
      assert.equal(getSemestreAtual().length, 0);
    });
  });
});

describe("B31 — runSync modos", () => {
  test("full executa todas as etapas em mock", async () => {
    const { executeMockSyncPipeline } = await import(
      "../src/lib/sync/execute-mock-sync-pipeline"
    );

    const result = await executeMockSyncPipeline(
      { username: "12345678901", password: "senha", savePassword: false },
      "full"
    );

    assert.equal(result.stages.length, 3);
    assert.ok(
      result.stages.some(
        (stage) => stage.stage === "historico" && stage.outcome === "ok"
      )
    );
  });

  test("incremental pula histórico quando recente", async () => {
    const { executeMockSyncPipeline } = await import(
      "../src/lib/sync/execute-mock-sync-pipeline"
    );
    const { recordHistoricoSyncedAt } = await import(
      "../src/lib/sync/sync-preferences"
    );

    await executeMockSyncPipeline(
      { username: "12345678901", password: "senha", savePassword: false },
      "full"
    );
    recordHistoricoSyncedAt();

    const incremental = await executeMockSyncPipeline(
      { username: "12345678901", password: "senha", savePassword: false },
      "incremental"
    );

    const historico = incremental.stages.find((stage) => stage.stage === "historico");
    assert.equal(historico?.outcome, "skipped");
  });
});
