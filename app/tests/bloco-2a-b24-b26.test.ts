/**
 * Suite B24–B26: auth mock, AES, erros, credential store, runSync.
 * DB temporário isolado — env definido antes de importar módulos de banco.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, before, describe, test } from "node:test";

const TEST_KEY = "test-encryption-key-32-chars!!";
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "planner-b24-"));

process.env.DB_PATH = path.join(tmpDir, "test.db");
process.env.CREDENTIALS_ENCRYPTION_KEY = TEST_KEY;
process.env.SIGAA_SCRAPER_MOCK = "true";

after(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe("B25 — AES-256-GCM", () => {
  test("cifra e decifra senha SIGAA", async () => {
    const { encryptSecret, decryptSecret } = await import(
      "../src/lib/crypto/aes-gcm"
    );
    const plain = "senha-sigaa-secreta-123";
    const encrypted = encryptSecret(plain);
    assert.notEqual(encrypted, plain);
    assert.equal(decryptSecret(encrypted), plain);
  });

  test("payload inválido falha ao decifrar", async () => {
    const { decryptSecret } = await import("../src/lib/crypto/aes-gcm");
    assert.throws(() => decryptSecret('{"v":99}'));
  });
});

describe("B26 — ScraperError", () => {
  test("mapeia códigos para status HTTP corretos", async () => {
    const { ScraperError } = await import("../src/lib/scraper/errors");

    assert.equal(ScraperError.invalidCredentials().toApiError().status, 401);
    assert.equal(ScraperError.offline().toApiError().status, 503);
    assert.equal(ScraperError.timeout().toApiError().status, 504);
    assert.equal(ScraperError.authFailed("x").toApiError().status, 502);
  });

  test("mapUnknownScraperError classifica timeout e rede", async () => {
    const { ScraperError, mapUnknownScraperError } = await import(
      "../src/lib/scraper/errors"
    );

    assert.equal(
      mapUnknownScraperError(new Error("Navigation timeout exceeded")).code,
      "SIGAA_TIMEOUT"
    );
    assert.equal(
      mapUnknownScraperError(new Error("net::ERR_CONNECTION_REFUSED")).code,
      "SIGAA_OFFLINE"
    );
    assert.equal(mapUnknownScraperError(ScraperError.offline()).code, "SIGAA_OFFLINE");
  });
});

describe("B24 — loginSigaa (mock)", () => {
  test("mock aceita credenciais válidas", async () => {
    const { loginSigaa } = await import("../src/lib/scraper/auth");
    const session = await loginSigaa({
      username: "12345678901",
      password: "MinhaSenha",
    });
    assert.equal(session.username, "12345678901");
    assert.ok(session.loggedInAt);
  });

  test("mock rejeita senha erro", async () => {
    const { loginSigaa } = await import("../src/lib/scraper/auth");
    const { ScraperError } = await import("../src/lib/scraper/errors");

    await assert.rejects(
      () => loginSigaa({ username: "12345678901", password: "erro" }),
      (error: unknown) =>
        error instanceof ScraperError && error.code === "INVALID_CREDENTIALS"
    );
  });

  test("mock rejeita usuário offline", async () => {
    const { loginSigaa } = await import("../src/lib/scraper/auth");
    const { ScraperError } = await import("../src/lib/scraper/errors");

    await assert.rejects(
      () => loginSigaa({ username: "offline", password: "x" }),
      (error: unknown) =>
        error instanceof ScraperError && error.code === "SIGAA_OFFLINE"
    );
  });
});

describe("B25 — sigaa-credential-store", () => {
  before(async () => {
    const { ensureDbReady } = await import("../src/lib/db/bootstrap");
    ensureDbReady();
  });

  test("persiste e recupera credenciais cifradas", async () => {
    const store = await import("../src/lib/crypto/sigaa-credential-store");
    store.persistSigaaCredentials("12345678901", "SenhaSigaa123");
    const loaded = store.loadSigaaCredentials();
    assert.deepEqual(loaded, {
      username: "12345678901",
      password: "SenhaSigaa123",
    });
  });

  test("clear remove senha persistida", async () => {
    const store = await import("../src/lib/crypto/sigaa-credential-store");
    store.clearSigaaCredentials();
    assert.equal(store.loadSigaaCredentials(), null);
  });
});

describe("B26 — resolveSyncCredentials", () => {
  test("usa senha do body quando informada", async () => {
    const { resolveSyncCredentials } = await import(
      "../src/lib/sync/resolve-credentials"
    );
    const resolved = resolveSyncCredentials({
      username: "12345678901",
      password: "SenhaNova",
      savePassword: false,
    });
    assert.equal(resolved.password, "SenhaNova");
    assert.equal(resolved.savePassword, false);
  });

  test("recupera senha cifrada quando body vem vazio", async () => {
    const store = await import("../src/lib/crypto/sigaa-credential-store");
    store.persistSigaaCredentials("12345678901", "SenhaArmazenada");

    const { resolveSyncCredentials } = await import(
      "../src/lib/sync/resolve-credentials"
    );
    const resolved = resolveSyncCredentials({
      username: "12345678901",
      password: "",
      savePassword: true,
    });
    assert.equal(resolved.password, "SenhaArmazenada");
  });
});

describe("B24–B26 — runSync (mock)", () => {
  test("pipeline completa com auth mock", async () => {
    const { runSync } = await import("../src/lib/sync/run-sync");
    const result = await runSync({
      username: "12345678901",
      password: "MinhaSenha",
      savePassword: false,
    });

    assert.ok(result.session.username);
    assert.equal(result.steps.at(-1)?.progress, 100);
    assert.ok(result.steps.some((step) => step.label.includes("Autenticando")));
  });

  test("runSync propaga credencial inválida", async () => {
    const { runSync } = await import("../src/lib/sync/run-sync");
    const { ApiError } = await import("../src/lib/api/errors");

    await assert.rejects(
      () =>
        runSync({
          username: "12345678901",
          password: "erro",
        }),
      (error: unknown) =>
        error instanceof ApiError && error.code === "INVALID_CREDENTIALS"
    );
  });
});
