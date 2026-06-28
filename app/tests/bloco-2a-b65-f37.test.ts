/**
 * B65 — sync automático da plataforma.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, before, describe, test } from "node:test";

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "planner-b65-"));
process.env.DB_PATH = path.join(tmpDir, "test.db");

after(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe("B65 — sync automático", () => {
  before(async () => {
    const { ensureDbReady } = await import("../src/lib/db/bootstrap");
    ensureDbReady();
  });

  test("intervalo automático é fixo da plataforma", async () => {
    const prefs = await import("../src/lib/sync/sync-preferences");

    assert.equal(prefs.getSyncAutoIntervalMinutes(), prefs.SYNC_AUTO_INTERVAL_MINUTES);
    assert.equal(prefs.SYNC_AUTO_INTERVAL_MINUTES, 30);
  });

  test("clearSyncLastAt remove timer de último sync", async () => {
    const prefs = await import("../src/lib/sync/sync-preferences");

    prefs.recordSyncCompletedAt(new Date().toISOString());
    assert.ok(prefs.getSyncLastAt());
    prefs.clearSyncLastAt();
    assert.equal(prefs.getSyncLastAt(), null);
  });
});

describe("F37 — buildPerfil", () => {
  test("sync automático sempre ativo no perfil", async () => {
    const { buildPerfil } = await import("../src/lib/perfil/build-perfil");
    const response = buildPerfil();

    assert.equal(response.profile, null);
    assert.equal(response.sync.automatic, true);
    assert.equal(response.sync.intervalMinutes, 30);
  });
});
