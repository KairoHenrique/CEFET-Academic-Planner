/**
 * B65 — rate limit e prefs de sync automático.
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

describe("B65 — sync rate limit", () => {
  before(async () => {
    const { ensureDbReady } = await import("../src/lib/db/bootstrap");
    ensureDbReady();
  });

  test("bloqueia sync antes do intervalo mínimo", async () => {
    const rateLimit = await import("../src/lib/sync/sync-rate-limit");
    const prefs = await import("../src/lib/sync/sync-preferences");

    prefs.recordSyncCompletedAt(new Date().toISOString());

    assert.throws(() => rateLimit.assertSyncRateLimit(), (error: unknown) => {
      return (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "RATE_LIMITED"
      );
    });
  });

  test("salva prefs de sync automático", async () => {
    const prefs = await import("../src/lib/sync/sync-preferences");

    prefs.saveSyncPreferences({ autoEnabled: true, intervalMinutes: 60 });
    const loaded = prefs.getSyncPreferences();

    assert.equal(loaded.autoEnabled, true);
    assert.equal(loaded.intervalMinutes, 60);
  });
});

describe("F37 — buildPerfil", () => {
  test("retorna perfil nulo sem aluno sincronizado", async () => {
    const { buildPerfil } = await import("../src/lib/perfil/build-perfil");
    const response = buildPerfil();

    assert.equal(response.profile, null);
    assert.ok(response.sync.intervalOptions.length >= 4);
  });
});
