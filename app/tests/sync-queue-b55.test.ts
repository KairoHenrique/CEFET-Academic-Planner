/**
 * B55 — fila sync SQLite: enqueue, lanes, cooldown, dispatcher inline.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, before, describe, test } from "node:test";

const TEST_KEY = "test-encryption-key-32-chars!!";
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "planner-b55-"));

process.env.PLANNER_DATA_ROOT = tmpDir;
process.env.SYNC_QUEUE_DB_PATH = path.join(tmpDir, "sync-queue.db");
process.env.CREDENTIALS_ENCRYPTION_KEY = TEST_KEY;
process.env.SIGAA_SCRAPER_MOCK = "true";
process.env.SYNC_QUEUE_DISPATCH = "inline";
delete process.env.SIGAA_WORKER_URL;
delete process.env.WORKER_SHARED_SECRET;

after(async () => {
  const { resetSyncQueueDatabaseForTests } = await import(
    "../src/lib/sync-queue/sync-queue-store"
  );
  resetSyncQueueDatabaseForTests();
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe("B55 — validate enqueue", () => {
  test("parse request mínimo", async () => {
    const { parseEnqueueSyncQueueRequest } = await import(
      "../src/lib/sync-queue/validate-enqueue-request"
    );

    const input = parseEnqueueSyncQueueRequest({
      username: "123456",
      password: "secret",
      lane: "priority",
      trigger: "first_login",
    });

    assert.equal(input.username, "123456");
    assert.equal(input.lane, "priority");
    assert.equal(input.trigger, "first_login");
    assert.equal(input.mode, "full");
  });

  test("rejeita lane inválida", async () => {
    const { parseEnqueueSyncQueueRequest } = await import(
      "../src/lib/sync-queue/validate-enqueue-request"
    );

    assert.throws(
      () =>
        parseEnqueueSyncQueueRequest({
          username: "1",
          password: "x",
          lane: "fast",
        }),
      /lane/
    );
  });
});

describe("B55 — sync queue store", () => {
  before(async () => {
    const { resetSyncQueueDatabaseForTests } = await import(
      "../src/lib/sync-queue/sync-queue-store"
    );
    resetSyncQueueDatabaseForTests();
  });

  test("priority entra na frente de normal", async () => {
    const { resetSyncQueueDatabaseForTests } = await import(
      "../src/lib/sync-queue/sync-queue-store"
    );
    const { enqueueSyncJob } = await import(
      "../src/lib/sync-queue/enqueue-sync-job"
    );

    resetSyncQueueDatabaseForTests();

    const normal = enqueueSyncJob({
      username: "111",
      password: "a",
      lane: "normal",
      trigger: "auto",
    });
    const priority = enqueueSyncJob({
      username: "222",
      password: "b",
      lane: "priority",
      trigger: "first_login",
    });
    const { getSyncQueueJobView } = await import(
      "../src/lib/sync-queue/to-sync-queue-job-view"
    );

    assert.equal(normal.job.position, 1);
    assert.equal(priority.job.position, 1);
    assert.equal(getSyncQueueJobView(normal.job.jobId).position, 2);
  });

  test("idempotency reutiliza job ativo", async () => {
    const { resetSyncQueueDatabaseForTests } = await import(
      "../src/lib/sync-queue/sync-queue-store"
    );
    const { enqueueSyncJob } = await import(
      "../src/lib/sync-queue/enqueue-sync-job"
    );

    resetSyncQueueDatabaseForTests();

    const first = enqueueSyncJob({
      username: "333",
      password: "x",
      lane: "normal",
      trigger: "manual",
      idempotencyKey: "idem-1",
    });
    const second = enqueueSyncJob({
      username: "333",
      password: "x",
      lane: "normal",
      trigger: "manual",
      idempotencyKey: "idem-1",
    });

    assert.equal(first.job.jobId, second.job.jobId);
    assert.equal(second.reused, true);
  });

  test("cooldown manual 429", async () => {
    const { resetSyncQueueDatabaseForTests } = await import(
      "../src/lib/sync-queue/sync-queue-store"
    );
    const { enqueueSyncJob } = await import(
      "../src/lib/sync-queue/enqueue-sync-job"
    );
    const { ApiError } = await import("../src/lib/api/errors");

    resetSyncQueueDatabaseForTests();

    enqueueSyncJob({
      username: "444",
      password: "x",
      lane: "normal",
      trigger: "manual",
    });

    assert.throws(
      () =>
        enqueueSyncJob({
          username: "444",
          password: "x",
          lane: "normal",
          trigger: "manual",
        }),
      (error: unknown) =>
        error instanceof ApiError &&
        error.code === "RATE_LIMITED" &&
        error.status === 429
    );
  });
});

describe("B55 — dispatcher", () => {
  before(async () => {
    const { resetSyncQueueDatabaseForTests } = await import(
      "../src/lib/sync-queue/sync-queue-store"
    );
    const { setSyncQueueDispatchHandlerForTests } = await import(
      "../src/lib/sync-queue/sync-queue-dispatcher"
    );
    resetSyncQueueDatabaseForTests();
    setSyncQueueDispatchHandlerForTests(null);
  });

  test("processa job até completed", async () => {
    const { resetSyncQueueDatabaseForTests, findSyncJobById } = await import(
      "../src/lib/sync-queue/sync-queue-store"
    );
    const { enqueueSyncJob } = await import(
      "../src/lib/sync-queue/enqueue-sync-job"
    );
    const {
      kickSyncQueueDispatcher,
      awaitSyncQueueDispatcherIdle,
      setSyncQueueDispatchHandlerForTests,
    } = await import("../src/lib/sync-queue/sync-queue-dispatcher");

    resetSyncQueueDatabaseForTests();
    setSyncQueueDispatchHandlerForTests(async (job) => ({
      jobId: job.id,
      status: "completed",
      durationMs: 12,
      steps: [{ label: "mock", progress: 100 }],
    }));

    const { job } = enqueueSyncJob({
      username: "55566677788",
      password: "mock-pass",
      lane: "normal",
      trigger: "auto",
      mode: "incremental",
    });

    kickSyncQueueDispatcher();
    await awaitSyncQueueDispatcherIdle();

    const record = findSyncJobById(job.jobId);
    assert.ok(record);
    assert.equal(record.status, "completed");
    assert.equal(record.passwordEnc, "");
    assert.match(record.resultJson ?? "", /mock/);
  });
});

describe("B55 — job view", () => {
  test("GET view inclui position e eta", async () => {
    const { resetSyncQueueDatabaseForTests } = await import(
      "../src/lib/sync-queue/sync-queue-store"
    );
    const { enqueueSyncJob } = await import(
      "../src/lib/sync-queue/enqueue-sync-job"
    );
    const { getSyncQueueJobView } = await import(
      "../src/lib/sync-queue/to-sync-queue-job-view"
    );

    resetSyncQueueDatabaseForTests();

    const { job } = enqueueSyncJob({
      username: "999",
      password: "y",
      lane: "normal",
      trigger: "auto",
    });

    const view = getSyncQueueJobView(job.jobId);
    assert.equal(view.jobId, job.jobId);
    assert.equal(view.position, 1);
    assert.ok(view.etaSeconds >= 0);
  });
});
