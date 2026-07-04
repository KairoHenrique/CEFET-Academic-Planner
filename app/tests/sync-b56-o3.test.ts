/**
 * B56 — worker passwordEnc · O3 — cooldown policy.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, before, describe, test } from "node:test";

describe("B56 — worker passwordEnc", () => {
  test("parse job com passwordEnc", async () => {
    const { parseWorkerJobRequest } = await import(
      "../src/lib/worker/validate-job-request"
    );

    const job = parseWorkerJobRequest({
      jobId: "job-enc",
      robot: "r1",
      username: "123",
      passwordEnc: "enc:payload",
    });

    assert.equal(job.passwordEnc, "enc:payload");
    assert.equal(job.password, undefined);
  });

  test("resolveWorkerJobPassword decifra passwordEnc", async () => {
    process.env.CREDENTIALS_ENCRYPTION_KEY = "test-encryption-key-32-chars!!";

    const { encryptSecret } = await import("../src/lib/crypto/aes-gcm");
    const { resolveWorkerJobPassword } = await import(
      "../src/lib/worker/resolve-worker-password"
    );

    const passwordEnc = encryptSecret("sigaa-secret");
    const password = resolveWorkerJobPassword({
      jobId: "1",
      robot: "r1",
      username: "123",
      passwordEnc,
    });

    assert.equal(password, "sigaa-secret");
  });
});

describe("O3 — sync cooldown policy", () => {
  const originalProfile = process.env.SYNC_COOLDOWN_PROFILE;
  const originalInterval = process.env.SYNC_AUTO_INTERVAL_MINUTES;

  after(() => {
    if (originalProfile === undefined) {
      delete process.env.SYNC_COOLDOWN_PROFILE;
    } else {
      process.env.SYNC_COOLDOWN_PROFILE = originalProfile;
    }

    if (originalInterval === undefined) {
      delete process.env.SYNC_AUTO_INTERVAL_MINUTES;
    } else {
      process.env.SYNC_AUTO_INTERVAL_MINUTES = originalInterval;
    }
  });

  test("produção usa 3h de auto-sync", async () => {
    process.env.SYNC_COOLDOWN_PROFILE = "production";
    delete process.env.SYNC_AUTO_INTERVAL_MINUTES;

    const { getSyncAutoIntervalMinutes, getSyncAutoCooldownMs } = await import(
      "../src/lib/sync/sync-cooldown-policy"
    );

    assert.equal(getSyncAutoIntervalMinutes(), 180);
    assert.equal(getSyncAutoCooldownMs(), 180 * 60_000);
  });

  test("dev mantém 30 min", async () => {
    process.env.SYNC_COOLDOWN_PROFILE = "development";
    delete process.env.SYNC_AUTO_INTERVAL_MINUTES;

    const { getSyncAutoIntervalMinutes } = await import(
      "../src/lib/sync/sync-cooldown-policy"
    );

    assert.equal(getSyncAutoIntervalMinutes(), 30);
  });

  test("auto-sync elegível após intervalo", async () => {
    const { isAutoSyncEligible, getSyncAutoCooldownMs } = await import(
      "../src/lib/sync/sync-cooldown-policy"
    );

    const lastAt = new Date(Date.now() - getSyncAutoCooldownMs() - 1000).toISOString();
    assert.equal(isAutoSyncEligible(lastAt), true);

    const recent = new Date().toISOString();
    assert.equal(isAutoSyncEligible(recent), false);
  });
});

describe("O3 — enqueue auto cooldown", () => {
  const tmpKey = "test-encryption-key-32-chars!!";
  let tmpDir = "";

  before(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "planner-o3-"));
    process.env.PLANNER_DATA_ROOT = tmpDir;
    process.env.SYNC_QUEUE_DB_PATH = path.join(tmpDir, "sync-queue.db");
    process.env.CREDENTIALS_ENCRYPTION_KEY = tmpKey;
    process.env.DB_PATH = path.join(tmpDir, "user.db");
  });

  after(async () => {
    const { resetSyncQueueDatabaseForTests } = await import(
      "../src/lib/sync-queue/sync-queue-store"
    );
    resetSyncQueueDatabaseForTests();
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      // ignore EPERM on Windows when db ainda aberto
    }
  });

  before(async () => {
    const { resetSyncQueueDatabaseForTests } = await import(
      "../src/lib/sync-queue/sync-queue-store"
    );
    resetSyncQueueDatabaseForTests();
  });

  async function withUserDb<T>(username: string, fn: () => T): Promise<T> {
    const { ensureDbReady } = await import("../src/lib/db/bootstrap");
    const { runWithUserDb } = await import("../src/lib/db/connection-manager");
    return runWithUserDb(username, () => {
      ensureDbReady();
      return fn();
    });
  }

  test("auto trigger respeita cooldown 3h", async () => {
    process.env.SYNC_COOLDOWN_PROFILE = "production";
    process.env.SYNC_AUTO_INTERVAL_MINUTES = "180";

    const { resetSyncQueueDatabaseForTests } = await import(
      "../src/lib/sync-queue/sync-queue-store"
    );
    const { enqueueSyncJob } = await import(
      "../src/lib/sync-queue/enqueue-sync-job"
    );
    const { recordSyncCompletedAt } = await import(
      "../src/lib/sync/sync-preferences"
    );
    const { ApiError } = await import("../src/lib/api/errors");

    resetSyncQueueDatabaseForTests();

    await withUserDb("999", () => {
      recordSyncCompletedAt(new Date().toISOString());

      assert.throws(
        () =>
          enqueueSyncJob({
            username: "999",
            password: "x",
            trigger: "auto",
          }),
        (error: unknown) =>
          error instanceof ApiError &&
          error.code === "RATE_LIMITED" &&
          error.status === 429
      );
    });
  });

  test("skipCooldown ignora auto e manual", async () => {
    const { resetSyncQueueDatabaseForTests } = await import(
      "../src/lib/sync-queue/sync-queue-store"
    );
    const { enqueueSyncJob } = await import(
      "../src/lib/sync-queue/enqueue-sync-job"
    );
    const { recordSyncCompletedAt } = await import(
      "../src/lib/sync/sync-preferences"
    );

    resetSyncQueueDatabaseForTests();

    const result = await withUserDb("888", () => {
      recordSyncCompletedAt(new Date().toISOString());

      return enqueueSyncJob({
        username: "888",
        password: "x",
        trigger: "dev",
        skipCooldown: true,
      });
    });

    assert.equal(result.reused, false);
    assert.equal(result.job.status, "queued");
  });
});
